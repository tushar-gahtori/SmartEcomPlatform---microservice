package com.example.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private String userEmail;

    @OneToMany(mappedBy = "cart",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "DECIMAL(10,2)")
    @Builder.Default
    private double totalCartPrice = 0.0;

    public void addItem(CartItem item) {
        items.add(item);
        item.setCart(this);
    }

    public void clearItems() {
        items.clear();
        this.totalCartPrice = 0.0;
    }
}