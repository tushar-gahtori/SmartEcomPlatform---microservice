package com.example.productservice.service;

import com.example.common.dto.PaginatedResponse;
import com.example.common.dto.ProductResponseDTO;
import com.example.common.exception.BadRequestException;
import com.example.common.exception.ResourceNotFoundException;
import com.example.productservice.dto.ProductRequestDTO;
import com.example.productservice.dto.StockDeductRequestDTO;
import com.example.productservice.entity.Product;
import com.example.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ModelMapper modelMapper;

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "products", key = "'all'")
    public ProductResponseDTO createProduct(ProductRequestDTO dto) {
        Product product = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .imageUrl(dto.getImageUrl())
                .price(dto.getPrice())
                .stock(dto.getStock())
                .build();

        Product saved = productRepository.save(product);
        log.info("Product created: {} (id={})", saved.getName(), saved.getId());
        return mapToResponse(saved);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    // Cache the full list under key "all" — evicted on any create/update/delete
    @Cacheable(value = "products", key = "'all'")
    public List<ProductResponseDTO> getAllProducts() {
        log.info("Cache MISS — fetching all products from DB");
        return productRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "#id")
    public ProductResponseDTO getProductById(Long id) {
        log.info("Cache MISS — fetching product {} from DB", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ProductResponseDTO> getProductsPaginated(
            int page, int size, String sortBy, String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> productPage = productRepository.findAll(pageable);

        List<ProductResponseDTO> content = productPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.of(
                content,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ProductResponseDTO> searchProducts(
            String name, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Product> result = productRepository
                .findByNameContainingIgnoreCase(name, pageable);

        return PaginatedResponse.of(
                result.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getProductsByCategory(String category) {
        return productRepository.findByCategory(category)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", key = "#id"),
            @CacheEvict(value = "products", key = "'all'")
    })
    public ProductResponseDTO updateProduct(Long id, ProductRequestDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCategory(dto.getCategory());
        product.setImageUrl(dto.getImageUrl());
        product.setPrice(dto.getPrice());
        product.setStock(dto.getStock());

        Product updated = productRepository.save(product);
        log.info("Product updated: {} (id={})", updated.getName(), updated.getId());
        return mapToResponse(updated);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", key = "#id"),
            @CacheEvict(value = "products", key = "'all'")
    })
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", "id", id);
        }
        productRepository.deleteById(id);
        log.info("Product deleted with id: {}", id);
    }

    // ── INTERNAL — called by Order Service via Feign ──────────────────────────

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", key = "#request.productId"),
            @CacheEvict(value = "products", key = "'all'")
    })
    public void deductStock(StockDeductRequestDTO request) {
        int rowsAffected = productRepository.deductStock(
                request.getProductId(),
                request.getQuantity()
        );

        if (rowsAffected == 0) {
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product", "id", request.getProductId()));

            throw new BadRequestException("stock",
                    "Insufficient stock for product: " + product.getName()
                            + ". Available: " + product.getStock()
                            + ", Requested: " + request.getQuantity());
        }

        log.info("Stock deducted — productId={}, quantity={}",
                request.getProductId(), request.getQuantity());
    }

    // ── STOCK ROLLBACK — called if order fails after stock was deducted ────────

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", key = "#productId"),
            @CacheEvict(value = "products", key = "'all'")
    })
    public void rollbackStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        product.setStock(product.getStock() + quantity);
        productRepository.save(product);
        log.warn("Stock rolled back — productId={}, quantity={}", productId, quantity);
    }

    // ── MAPPER ────────────────────────────────────────────────────────────────

    private ProductResponseDTO mapToResponse(Product product) {
        return modelMapper.map(product, ProductResponseDTO.class);
    }
}