package com.example.orderservice.controller;

import com.example.common.dto.OrderRequestDTO;
import com.example.common.dto.OrderResponseDTO;
import com.example.common.response.ApiResponse;
import com.example.orderservice.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management")
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Create order directly from request body")
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponseDTO>> createOrder(
            @Valid @RequestBody OrderRequestDTO request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            Authentication authentication) {

        // Support both Gateway (headers) and direct Swagger calls (SecurityContext)
        if (userEmail == null || userEmail.isBlank()) {
            userEmail = authentication.getName();
        }
        if (userId == null) {
            userId = 0L;
        }

        OrderResponseDTO order = orderService.createOrder(request, userId, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Order placed successfully", order));
    }

    @Operation(summary = "Checkout from cart — converts active cart to order")
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> checkout(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            Authentication authentication) {

        if (userEmail == null || userEmail.isBlank()) {
            userEmail = authentication.getName();
        }
        if (userId == null) {
            userId = 0L;
        }

        OrderResponseDTO order = orderService.checkoutCart(userId, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Checkout successful", order));
    }

    @Operation(summary = "Get all orders for current user")
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getMyOrders(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            Authentication authentication) {

        if (userEmail == null || userEmail.isBlank()) {
            userEmail = authentication.getName();
        }

        return ResponseEntity.ok(ApiResponse.success("Orders fetched",
                orderService.getMyOrders(userEmail)));
    }

    @Operation(summary = "Get specific order by ID")
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> getOrderById(
            @PathVariable Long orderId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            Authentication authentication) {

        if (userEmail == null || userEmail.isBlank()) {
            userEmail = authentication.getName();
        }

        return ResponseEntity.ok(ApiResponse.success("Order fetched",
                orderService.getOrderById(orderId, userEmail)));
    }

    @Operation(summary = "Cancel an order")
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> cancelOrder(
            @PathVariable Long orderId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            Authentication authentication) {

        if (userEmail == null || userEmail.isBlank()) {
            userEmail = authentication.getName();
        }

        return ResponseEntity.ok(ApiResponse.success("Order cancelled",
                orderService.cancelOrder(orderId, userEmail)));
    }
}