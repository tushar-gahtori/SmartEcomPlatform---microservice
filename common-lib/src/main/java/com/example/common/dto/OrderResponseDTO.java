package com.example.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDTO implements Serializable {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private List<OrderItemResponseDTO> items;
    private double totalAmount;
    private String status;
    private LocalDateTime createdAt;
}