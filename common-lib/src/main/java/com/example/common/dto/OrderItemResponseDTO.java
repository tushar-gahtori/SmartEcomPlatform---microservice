package com.example.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponseDTO implements Serializable {
    private Long productId;
    private String productName;
    private int quantity;
    private double priceAtPurchase;
}