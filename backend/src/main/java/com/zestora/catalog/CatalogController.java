package com.zestora.catalog;

import com.zestora.common.ApiResponse;
import com.zestora.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public catalogue endpoints (food + grocery) and partner menu management. */
@RestController
@RequestMapping("/api/v1")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/restaurants")
    public ApiResponse<List<CatalogDtos.RestaurantDto>> restaurants(@RequestParam(required = false) String q,
                                                                    @RequestParam(defaultValue = "false") boolean vegOnly) {
        return ApiResponse.ok(catalog.searchRestaurants(q, vegOnly));
    }

    @GetMapping("/restaurants/{id}")
    public ApiResponse<CatalogDtos.RestaurantMenuDto> menu(@PathVariable Long id) {
        return ApiResponse.ok(catalog.menu(id));
    }

    @GetMapping("/products/{id}")
    public ApiResponse<CatalogDtos.ProductDto> product(@PathVariable Long id) {
        return ApiResponse.ok(catalog.product(id));
    }

    @GetMapping("/grocery/products")
    public ApiResponse<List<CatalogDtos.ProductDto>> grocery(@RequestParam(required = false) String category,
                                                             @RequestParam(required = false) String q) {
        return ApiResponse.ok(catalog.grocery(category, q));
    }

    // ── partner ──

    @GetMapping("/partner/restaurant")
    public ApiResponse<CatalogDtos.RestaurantMenuDto> myMenu() {
        return ApiResponse.ok(catalog.myMenu(AuthUser.current()));
    }

    @PatchMapping("/partner/restaurant/open")
    public ApiResponse<CatalogDtos.RestaurantDto> setOpen(@Valid @RequestBody CatalogDtos.OpenRequest req) {
        return ApiResponse.ok(catalog.setOpen(AuthUser.current(), req.open()));
    }

    @PostMapping("/partner/products")
    public ApiResponse<CatalogDtos.ProductDto> create(@Valid @RequestBody CatalogDtos.ProductCreateRequest req) {
        return ApiResponse.ok(catalog.createProduct(AuthUser.current(), req));
    }

    @PutMapping("/partner/products/{id}")
    public ApiResponse<CatalogDtos.ProductDto> update(@PathVariable Long id,
                                                      @Valid @RequestBody CatalogDtos.ProductUpdateRequest req) {
        return ApiResponse.ok(catalog.updateProduct(AuthUser.current(), id, req));
    }
}
