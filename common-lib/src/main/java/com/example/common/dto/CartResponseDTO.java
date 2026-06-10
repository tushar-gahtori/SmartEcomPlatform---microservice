package com.example.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartResponseDTO implements Serializable {
    private Long cartId;
    private Long userId;
    private List<CartItemResponseDTO> items;
    private double totalCartPrice;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemResponseDTO implements Serializable {
        private Long productId;
        private String productName;
        private int quantity;
        private double unitPrice;
        private double totalPrice;
    }
}