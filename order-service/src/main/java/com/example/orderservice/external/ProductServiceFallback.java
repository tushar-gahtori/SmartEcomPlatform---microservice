package com.example.orderservice.external;

import com.example.common.dto.ProductResponseDTO;
import com.example.common.exception.ServiceUnavailableException;
import com.example.common.response.ApiResponse;
import com.example.orderservice.dto.StockDeductRequestDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ProductServiceFallback implements ProductServiceClient {

    @Override
    public ApiResponse<ProductResponseDTO> getProductById(Long id) {
        log.error("FALLBACK: Product Service unavailable — getProductById({})", id);
        throw new ServiceUnavailableException("Product Service");
    }

    @Override
    public ApiResponse<String> deductStock(StockDeductRequestDTO request) {
        log.error("FALLBACK: Product Service unavailable — deductStock({})",
                request.getProductId());
        throw new ServiceUnavailableException("Product Service");
    }

    @Override
    public ApiResponse<String> rollbackStock(Long productId, int quantity) {
        log.error("FALLBACK: Could not rollback stock for productId={}, qty={}. " +
                "Manual intervention required.", productId, quantity);
        return ApiResponse.error("Rollback failed — manual review required", 503);
    }
}