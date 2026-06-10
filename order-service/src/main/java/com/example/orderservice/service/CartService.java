package com.example.orderservice.service;

import com.example.common.dto.CartResponseDTO;
import com.example.common.dto.ProductResponseDTO;
import com.example.common.exception.BadRequestException;
import com.example.common.exception.ResourceNotFoundException;
import com.example.orderservice.entity.Cart;
import com.example.orderservice.entity.CartItem;
import com.example.orderservice.external.ProductServiceClient;
import com.example.orderservice.repository.CartItemRepository;
import com.example.orderservice.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductServiceClient productServiceClient;

    // ── ADD TO CART ───────────────────────────────────────────────────────────

    @Transactional
    public CartResponseDTO addToCart(Long userId, String userEmail,
                                     Long productId, int quantity) {

        ProductResponseDTO product = productServiceClient
                .getProductById(productId)
                .getData();

        if (product == null) {
            throw new ResourceNotFoundException("Product", "id", productId);
        }

        if (product.getStock() < quantity) {
            throw new BadRequestException("quantity",
                    "Insufficient stock. Available: " + product.getStock());
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .userId(userId)
                            .userEmail(userEmail)
                            .build();
                    return cartRepository.save(newCart);
                });

        CartItem existingItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
            cartItemRepository.save(existingItem);
            log.info("Cart item quantity updated — productId={}, newQty={}",
                    productId, existingItem.getQuantity());
        } else {
            CartItem newItem = CartItem.builder()
                    .productId(productId)
                    .productName(product.getName())
                    .quantity(quantity)
                    .unitPrice(product.getPrice())
                    .build();
            cart.addItem(newItem);
            log.info("New item added to cart — productId={}", productId);
        }

        recalculateCartTotal(cart);
        cartRepository.save(cart);

        return mapToResponse(cart);
    }

    // ── REMOVE FROM CART ──────────────────────────────────────────────────────

    @Transactional
    public CartResponseDTO removeFromCart(Long userId, Long productId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("No cart found"));

        CartItem item = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CartItem", "productId", productId));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        recalculateCartTotal(cart);
        cartRepository.save(cart);

        log.info("Item removed from cart — productId={}", productId);
        return mapToResponse(cart);
    }

    // ── GET CART ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CartResponseDTO getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException(
                        "No cart found. Add items to create one."));
        return mapToResponse(cart);
    }

    // ── CLEAR CART ────────────────────────────────────────────────────────────

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("No cart found"));
        cartItemRepository.deleteAllByCartId(cart.getId());
        cart.clearItems();
        cartRepository.save(cart);
        log.info("Cart cleared manually for userId={}", userId);
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private void recalculateCartTotal(Cart cart) {
        double total = cart.getItems().stream()
                .mapToDouble(item -> item.getUnitPrice() * item.getQuantity())
                .sum();
        cart.setTotalCartPrice(Math.round(total * 100.0) / 100.0);
    }

    private CartResponseDTO mapToResponse(Cart cart) {
        List<CartResponseDTO.CartItemResponseDTO> items = cart.getItems().stream()
                .map(item -> new CartResponseDTO.CartItemResponseDTO(
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        Math.round(item.getUnitPrice() * item.getQuantity() * 100.0) / 100.0
                ))
                .collect(Collectors.toList());

        return new CartResponseDTO(
                cart.getId(),
                cart.getUserId(),
                items,
                cart.getTotalCartPrice()
        );
    }
}