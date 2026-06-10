package com.example.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPlacedEvent implements Serializable {

    private String eventId;

    private Long orderId;
    private String userEmail;
    private String userName;
    private double totalAmount;
    private String status;
    private LocalDateTime occurredAt;

    public static OrderPlacedEvent of(Long orderId, String userEmail,
                                      String userName, double totalAmount) {
        return OrderPlacedEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .orderId(orderId)
                .userEmail(userEmail)
                .userName(userName)
                .totalAmount(totalAmount)
                .status("ORDER_PLACED")
                .occurredAt(LocalDateTime.now())
                .build();
    }
}