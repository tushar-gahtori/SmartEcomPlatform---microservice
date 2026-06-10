package com.example.productservice.controller;

import com.example.common.dto.PaginatedResponse;
import com.example.common.dto.ProductResponseDTO;
import com.example.common.response.ApiResponse;
import com.example.productservice.dto.ProductRequestDTO;
import com.example.productservice.dto.StockDeductRequestDTO;
import com.example.productservice.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product catalogue and stock management")
public class ProductController {

    private final ProductService productService;

    @Operation(summary = "Get all products — paginated")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductResponseDTO>>> getAllProducts(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "10")  int size,
            @RequestParam(defaultValue = "id")  String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        return ResponseEntity.ok(ApiResponse.success("Products fetched successfully",
                productService.getProductsPaginated(page, size, sortBy, sortDir)));
    }

    @Operation(summary = "Get product by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponseDTO>> getProductById(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Product fetched successfully",
                productService.getProductById(id)));
    }

    @Operation(summary = "Search products by name")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductResponseDTO>>> searchProducts(
            @RequestParam String name,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Search results",
                productService.searchProducts(name, page, size)));
    }

    @Operation(summary = "Get products by category")
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ProductResponseDTO>>> getByCategory(
            @PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.success("Products fetched by category",
                productService.getProductsByCategory(category)));
    }

    // ── ADMIN WRITE ENDPOINTS ─────────────────────────────────────────────────

    @Operation(summary = "Create product — ADMIN only")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponseDTO>> createProduct(
            @Valid @RequestBody ProductRequestDTO dto) {
        ProductResponseDTO created = productService.createProduct(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Product created successfully", created));
    }

    @Operation(summary = "Update product — ADMIN only")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponseDTO>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully",
                productService.updateProduct(id, dto)));
    }

    @Operation(summary = "Delete product — ADMIN only")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }

    // ── INTERNAL ENDPOINTS — called by Order Service via Feign ───────────────

    @Operation(summary = "Deduct stock — internal, called by Order Service")
    @PostMapping("/internal/deduct-stock")
    public ResponseEntity<ApiResponse<String>> deductStock(
            @Valid @RequestBody StockDeductRequestDTO request) {
        productService.deductStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock deducted successfully", null));
    }

    @Operation(summary = "Rollback stock — internal, called on order failure")
    @PostMapping("/internal/rollback-stock")
    public ResponseEntity<ApiResponse<String>> rollbackStock(
            @RequestParam Long productId,
            @RequestParam int quantity) {
        productService.rollbackStock(productId, quantity);
        return ResponseEntity.ok(ApiResponse.success("Stock rolled back successfully", null));
    }
}