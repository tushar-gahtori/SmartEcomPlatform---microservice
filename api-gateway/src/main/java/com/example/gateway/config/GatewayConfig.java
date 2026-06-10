package com.example.gateway.config;

import com.example.gateway.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class GatewayConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()

                // ── USER SERVICE ──────────────────────────────────────────────
                // Auth endpoints — public, no JWT filter applied
                .route("user-service-auth", r -> r
                        .path("/api/auth/**")
                        .uri("lb://USER-SERVICE"))  // lb = load-balanced via Eureka

                // User management endpoints — JWT required
                .route("user-service-users", r -> r
                        .path("/api/users/**")
                        .filters(f -> f.filter(jwtAuthFilter.apply(
                                new JwtAuthenticationFilter.Config())))
                        .uri("lb://USER-SERVICE"))

                // ── PRODUCT SERVICE ───────────────────────────────────────────
                .route("product-service", r -> r
                        .path("/api/products/**")
                        .filters(f -> f.filter(jwtAuthFilter.apply(
                                new JwtAuthenticationFilter.Config())))
                        .uri("lb://PRODUCT-SERVICE"))

                // ── ORDER SERVICE ─────────────────────────────────────────────
                .route("order-service-orders", r -> r
                        .path("/api/orders/**")
                        .filters(f -> f.filter(jwtAuthFilter.apply(
                                new JwtAuthenticationFilter.Config())))
                        .uri("lb://ORDER-SERVICE"))

                .route("order-service-cart", r -> r
                        .path("/api/cart/**")
                        .filters(f -> f.filter(jwtAuthFilter.apply(
                                new JwtAuthenticationFilter.Config())))
                        .uri("lb://ORDER-SERVICE"))

                // ── PAYMENT SERVICE ───────────────────────────────────────────
                .route("payment-service", r -> r
                        .path("/api/payments/**")
                        .filters(f -> f.filter(jwtAuthFilter.apply(
                                new JwtAuthenticationFilter.Config())))
                        .uri("lb://PAYMENT-SERVICE"))

                .build();
    }
}