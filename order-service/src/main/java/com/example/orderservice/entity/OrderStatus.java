package com.example.orderservice.entity;

public enum OrderStatus {
    PENDING,        // Order created, awaiting payment
    CONFIRMED,      // Payment received, stock deducted
    SHIPPED,        // Dispatched from warehouse
    DELIVERED,      // Received by customer
    CANCELLED       // Cancelled by user or payment failure
}