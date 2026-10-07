package com.zestora.catalog;

import com.zestora.common.ApiException;
import com.zestora.common.AuditService;
import com.zestora.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogService {
    private final RestaurantRepository restaurants;
    private final ProductRepository products;
    private final AuditService audit;

    public CatalogService(RestaurantRepository restaurants, ProductRepository products, AuditService audit) {
        this.restaurants = restaurants;
        this.products = products;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.RestaurantDto> searchRestaurants(String q, boolean vegOnly) {
        return restaurants.search(likePattern(q), vegOnly).stream().map(CatalogDtos.RestaurantDto::of).toList();
    }

    @Transactional(readOnly = true)
    public CatalogDtos.RestaurantMenuDto menu(Long restaurantId) {
        Restaurant r = restaurants.findById(restaurantId).filter(Restaurant::isActive)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found"));
        var items = products.findByRestaurantIdOrderByIdAsc(restaurantId).stream()
                .map(CatalogDtos.ProductDto::of).toList();
        return new CatalogDtos.RestaurantMenuDto(CatalogDtos.RestaurantDto.of(r), items);
    }

    @Transactional(readOnly = true)
    public CatalogDtos.ProductDto product(Long id) {
        return products.findById(id).map(CatalogDtos.ProductDto::of)
                .orElseThrow(() -> ApiException.notFound("Product not found"));
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.ProductDto> grocery(String category, String q) {
        String cat = category == null || category.isBlank() ? "" : category.trim();
        return products.searchGrocery(cat, likePattern(q)).stream().map(CatalogDtos.ProductDto::of).toList();
    }

    /** Lower-cased LIKE pattern with wildcards in the user's text escaped away. */
    static String likePattern(String q) {
        if (q == null || q.isBlank()) return "%";
        return "%" + q.trim().toLowerCase().replace("%", "").replace("_", "") + "%";
    }

    // ───────────────────────── partner (restaurant staff) operations ─────────────────────────

    /** The restaurant owned by this staff user; admins must use the admin endpoints. */
    @Transactional(readOnly = true)
    public Restaurant restaurantOf(AuthUser user) {
        return restaurants.findByOwnerId(user.id())
                .orElseThrow(() -> ApiException.forbidden("No restaurant is linked to this account"));
    }

    /** The staff member's own restaurant with its full menu (including unavailable items). */
    @Transactional(readOnly = true)
    public CatalogDtos.RestaurantMenuDto myMenu(AuthUser user) {
        Restaurant r = restaurantOf(user);
        var items = products.findByRestaurantIdOrderByIdAsc(r.getId()).stream().map(CatalogDtos.ProductDto::of).toList();
        return new CatalogDtos.RestaurantMenuDto(CatalogDtos.RestaurantDto.of(r), items);
    }

    @Transactional
    public CatalogDtos.RestaurantDto setOpen(AuthUser user, boolean open) {
        Restaurant r = restaurantOf(user);
        r.setOpen(open);
        audit.record(user, open ? "RESTAURANT_OPENED" : "RESTAURANT_CLOSED", "Restaurant", r.getId(), null);
        return CatalogDtos.RestaurantDto.of(r);
    }

    @Transactional
    public CatalogDtos.ProductDto updateProduct(AuthUser user, Long productId, CatalogDtos.ProductUpdateRequest req) {
        Product p = ownedProduct(user, productId);
        if (req.price() != null) p.setPrice(req.price());
        if (req.available() != null) p.setAvailable(req.available());
        if (req.prepMinutes() != null) p.setPrepMinutes(req.prepMinutes());
        if (req.imageUrl() != null) p.setImageUrl(req.imageUrl());
        audit.record(user, "PRODUCT_UPDATED", "Product", p.getId(), "price=" + p.getPrice() + ", available=" + p.isAvailable());
        return CatalogDtos.ProductDto.of(p);
    }

    @Transactional
    public CatalogDtos.ProductDto createProduct(AuthUser user, CatalogDtos.ProductCreateRequest req) {
        Restaurant r = restaurantOf(user);
        Product p = new Product();
        p.setRestaurantId(r.getId());
        p.setName(req.name().trim());
        p.setDescription(req.description());
        p.setCategory(req.category());
        p.setPrice(req.price());
        p.setImageUrl(req.imageUrl());
        p.setVeg(req.veg());
        if (req.prepMinutes() != null) p.setPrepMinutes(req.prepMinutes());
        products.save(p);
        audit.record(user, "PRODUCT_CREATED", "Product", p.getId(), p.getName());
        return CatalogDtos.ProductDto.of(p);
    }

    private Product ownedProduct(AuthUser user, Long productId) {
        Product p = products.findById(productId).orElseThrow(() -> ApiException.notFound("Product not found"));
        if (user.role().isAdmin()) return p;
        Restaurant r = restaurantOf(user);
        if (!r.getId().equals(p.getRestaurantId())) throw ApiException.forbidden("This product belongs to another restaurant");
        return p;
    }
}
