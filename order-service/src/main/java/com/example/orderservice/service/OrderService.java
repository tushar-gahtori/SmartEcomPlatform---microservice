package com.example.orderservice.service;

import com.example.common.dto.OrderResponseDTO;
import com.example.common.dto.OrderItemResponseDTO;
import com.example.common.dto.OrderRequestDTO;
import com.example.common.dto.OrderItemRequestDTO;
import com.example.common.dto.ProductResponseDTO;
import com.example.common.event.OrderPlacedEvent;
import com.example.common.exception.BadRequestException;
import com.example.common.exception.ResourceNotFoundException;
import com.example.orderservice.dto.StockDeductRequestDTO;
import com.example.orderservice.entity.*;
import com.example.orderservice.external.ProductServiceClient;
import com.example.orderservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductServiceClient productServiceClient;
    private final KafkaProducerService kafkaProducerService;

    // ── CREATE ORDER ──────────────────────────────────────────────────────────

    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO request,
                                        Long userId, String userEmail) {

        Map<Long, Integer> consolidatedItems = new LinkedHashMap<>();
        for (var item : request.getItems()) {
            consolidatedItems.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }

        Order order = Order.builder()
                .userId(userId)
                .userEmail(userEmail)
                .status(OrderStatus.PENDING)
                .build();

        double total = 0.0;
        List<Long> deductedProductIds = new ArrayList<>();

        try {
            for (var entry : consolidatedItems.entrySet()) {
                Long productId = entry.getKey();
                int quantity   = entry.getValue();

                ProductResponseDTO product = productServiceClient
                        .getProductById(productId)
                        .getData();

                if (product == null) {
                    throw new ResourceNotFoundException("Product", "id", productId);
                }

                productServiceClient.deductStock(
                        new StockDeductRequestDTO(productId, quantity));
                deductedProductIds.add(productId);

                OrderItem item = OrderItem.builder()
                        .productId(productId)
                        .productName(product.getName())
                        .quantity(quantity)
                        .priceAtPurchase(product.getPrice())
                        .build();

                order.addItem(item);
                total += product.getPrice() * quantity;
            }

            order.setTotalAmount(Math.round(total * 100.0) / 100.0);
            order.setStatus(OrderStatus.CONFIRMED);
            Order savedOrder = orderRepository.save(order);

            final OrderPlacedEvent event = OrderPlacedEvent.of(
                    savedOrder.getId(),
                    userEmail,
                    userEmail,
                    savedOrder.getTotalAmount()
            );

            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            try {
                                log.info("TX committed — publishing OrderPlacedEvent " +
                                        "for orderId={}", savedOrder.getId());
                                kafkaProducerService.sendOrderPlacedEvent(event);
                            } catch (Exception e) {
                                log.error("Kafka publish failed for orderId={}: {}",
                                        savedOrder.getId(), e.getMessage());
                            }
                        }
                    }
            );

            return mapToResponse(savedOrder);

        } catch (Exception ex) {
            log.error("Order creation failed — rolling back {} stock deductions. Reason: {}",
                    deductedProductIds.size(), ex.getMessage());
            rollbackDeductedStock(deductedProductIds, consolidatedItems);
            throw ex;
        }
    }

    // ── CHECKOUT FROM CART ────────────────────────────────────────────────────

    @Transactional
    public OrderResponseDTO checkoutCart(Long userId, String userEmail) {

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException(
                        "No active cart found for user: " + userEmail));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("cart",
                    "Your cart is empty. Add products before checking out.");
        }

        // Step 1: Snapshot cart data into plain POJOs BEFORE any DB operations
        // This detaches us from Hibernate's session completely
        record CartSnapshot(Long productId, int quantity) {}

        List<CartSnapshot> snapshots = cart.getItems().stream()
                .map(ci -> new CartSnapshot(ci.getProductId(), ci.getQuantity()))
                .toList();

        Long cartId = cart.getId();

        // Step 2: Delete cart items using direct SQL — bypasses Hibernate session
        cartItemRepository.deleteAllByCartId(cartId);

        // Step 3: Reset cart total using direct update — no entity merge needed
        cartRepository.resetCartTotal(cartId);

        // Step 4: Flush and clear Hibernate session to prevent stale entity conflicts
        // The @Modifying queries above deleted rows Hibernate still has in memory
        // We need to clear the session before proceeding
        cartRepository.flush();

        // Step 5: Build order request from the snapshot (not from Hibernate entities)
        List<OrderItemRequestDTO> orderItems = snapshots.stream()
                .map(s -> new OrderItemRequestDTO(s.productId(), s.quantity()))
                .collect(Collectors.toList());

        OrderRequestDTO orderRequest = new OrderRequestDTO(orderItems);

        // Step 6: Create order — cart is already cleared, no session conflict possible
        OrderResponseDTO completedOrder = createOrder(orderRequest, userId, userEmail);

        log.info("Checkout complete for userId={}, orderId={}",
                userId, completedOrder.getOrderId());

        return completedOrder;
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getMyOrders(String userEmail) {
        return orderRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(Long orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUserEmail().equals(userEmail)) {
            throw new BadRequestException("You do not have permission to view this order");
        }
        return mapToResponse(order);
    }

    // ── CANCEL ────────────────────────────────────────────────────────────────

    @Transactional
    public OrderResponseDTO cancelOrder(Long orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUserEmail().equals(userEmail)) {
            throw new BadRequestException("You do not have permission to cancel this order");
        }

        if (order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("status",
                    "Cannot cancel an order that has already been " +
                            order.getStatus().name().toLowerCase());
        }

        order.getItems().forEach(item ->
                productServiceClient.rollbackStock(
                        item.getProductId(), item.getQuantity())
        );

        order.setStatus(OrderStatus.CANCELLED);
        return mapToResponse(orderRepository.save(order));
    }

    // ── PRIVATE ───────────────────────────────────────────────────────────────

    private void rollbackDeductedStock(List<Long> productIds,
                                       Map<Long, Integer> quantities) {
        for (Long productId : productIds) {
            try {
                productServiceClient.rollbackStock(productId, quantities.get(productId));
                log.info("Stock rolled back for productId={}", productId);
            } catch (Exception rollbackEx) {
                log.error("CRITICAL: Failed to rollback stock for productId={}. " +
                                "Manual review required. Error: {}",
                        productId, rollbackEx.getMessage());
            }
        }
    }

    private OrderResponseDTO mapToResponse(Order order) {
        List<OrderItemResponseDTO> itemDTOs = order.getItems().stream()
                .map(item -> new OrderItemResponseDTO(
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getPriceAtPurchase()
                ))
                .collect(Collectors.toList());

        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderId(order.getId());
        dto.setUserId(order.getUserId());
        dto.setUserEmail(order.getUserEmail());
        dto.setItems(itemDTOs);
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus().name());
        dto.setCreatedAt(order.getCreatedAt());
        return dto;
    }
}