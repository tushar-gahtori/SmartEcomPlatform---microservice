package com.example.orderservice.repository;

import com.example.orderservice.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUserId(Long userId);
    Optional<Cart> findByUserEmail(String userEmail);
    boolean existsByUserId(Long userId);

    @Modifying
    @Query("UPDATE Cart c SET c.totalCartPrice = 0.0 WHERE c.id = :cartId")
    void resetCartTotal(@Param("cartId") Long cartId);
}