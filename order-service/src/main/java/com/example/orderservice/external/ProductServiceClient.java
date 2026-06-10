package com.example.orderservice.external;

import com.example.common.dto.ProductResponseDTO;
import com.example.common.response.ApiResponse;
import com.example.orderservice.dto.StockDeductRequestDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "PRODUCT-SERVICE",
        fallback = ProductServiceFallback.class
)
public interface ProductServiceClient {

    @GetMapping("/api/products/{id}")
    ApiResponse<ProductResponseDTO> getProductById(@PathVariable("id") Long id);

    @PostMapping("/api/products/internal/deduct-stock")
    ApiResponse<String> deductStock(@RequestBody StockDeductRequestDTO request);

    @PostMapping("/api/products/internal/rollback-stock")
    ApiResponse<String> rollbackStock(
            @RequestParam("productId") Long productId,
            @RequestParam("quantity") int quantity);
}