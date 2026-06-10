package com.example.orderservice.controller;

import com.example.common.dto.CartResponseDTO;
import com.example.common.response.ApiResponse;
import com.example.orderservice.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management")
public class CartController {

    private final CartService cartService;

    @Operation(summary = "Get current user cart")
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponseDTO>> getCart(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            Authentication authentication) {

        if (userEmail == null || userEmail.isBlank()) {
            userEmail = authentication.getName();
        }
        if (userId == null) {
            userId = 0L;
        }

        return ResponseEntity.ok(ApiResponse.success("Cart fetched",
                cartService.getCart(userId)));
    }

    @Operation(summary = "Add item to cart")
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CartResponseDTO>> addToCart(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestParam Long productId,
            @RequestParam int quantity,
            Authentication authentication) {

        if (userEmail == null || userEmail.isBlank()) {
            userEmail = authentication.getName();
        }
        if (userId == null) {
            userId = 0L;
        }

        return ResponseEntity.ok(ApiResponse.success("Item added to cart",
                cartService.addToCart(userId, userEmail, productId, quantity)));
    }

    @Operation(summary = "Remove item from cart")
    @DeleteMapping("/remove")
    public ResponseEntity<ApiResponse<CartResponseDTO>> removeFromCart(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam Long productId,
            Authentication authentication) {

        if (userId == null) {
            userId = 0L;
        }

        return ResponseEntity.ok(ApiResponse.success("Item removed",
                cartService.removeFromCart(userId, productId)));
    }

    @Operation(summary = "Clear entire cart")
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<String>> clearCart(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            Authentication authentication) {

        if (userId == null) {
            userId = 0L;
        }

        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }
}