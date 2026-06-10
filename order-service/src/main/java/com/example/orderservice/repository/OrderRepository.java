package com.example.orderservice.repository;

import com.example.orderservice.entity.Order;
import com.example.orderservice.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    Page<Order> findByUserEmail(String userEmail, Pageable pageable);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByUserEmailAndStatus(String userEmail, OrderStatus status);
}