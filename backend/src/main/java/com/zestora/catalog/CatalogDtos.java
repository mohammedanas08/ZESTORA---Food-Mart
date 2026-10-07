package com.zestora.catalog;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() {}

    public record RestaurantDto(Long id, String name, String slug, String description, List<String> cuisines,
                                String imageUrl, BigDecimal rating, int reviewCount, int deliveryMin, int deliveryMax,
                                BigDecimal minOrder, BigDecimal costForTwo, boolean vegOnly, boolean open, String city) {
        public static RestaurantDto of(Restaurant r) {
            List<String> cuisines = r.getCuisines() == null || r.getCuisines().isBlank()
                    ? List.of() : List.of(r.getCuisines().split("\\s*,\\s*"));
            return new RestaurantDto(r.getId(), r.getName(), r.getSlug(), r.getDescription(), cuisines, r.getImageUrl(),
                    r.getRating(), r.getReviewCount(), r.getDeliveryMin(), r.getDeliveryMax(), r.getMinOrder(),
                    r.getCostForTwo(), r.isVegOnly(), r.isOpen(), r.getCity());
        }
    }

    public record OptionDto(Long id, String name, BigDecimal price) {}

    public record ProductDto(Long id, Long restaurantId, String name, String description, String category,
                             BigDecimal price, String imageUrl, Boolean veg, boolean available, boolean grocery,
                             Integer stock, int prepMinutes, List<OptionDto> variants, List<OptionDto> addons) {
        public static ProductDto of(Product p) {
            return new ProductDto(p.getId(), p.getRestaurantId(), p.getName(), p.getDescription(), p.getCategory(),
                    p.getPrice(), p.getImageUrl(), p.getVeg(), p.isAvailable(), p.isGrocery(), p.getStock(), p.getPrepMinutes(),
                    p.getVariants().stream().map(v -> new OptionDto(v.getId(), v.getName(), v.getPrice())).toList(),
                    p.getAddons().stream().map(a -> new OptionDto(a.getId(), a.getName(), a.getPrice())).toList());
        }
    }

    public record RestaurantMenuDto(RestaurantDto restaurant, List<ProductDto> items) {}

    public record ProductUpdateRequest(@DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal price,
                                       Boolean available,
                                       @Min(1) @Max(240) Integer prepMinutes,
                                       @Size(max = 500) String imageUrl) {}

    public record ProductCreateRequest(@NotBlank @Size(max = 160) String name,
                                       @Size(max = 500) String description,
                                       @Size(max = 80) String category,
                                       @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal price,
                                       @Size(max = 500) String imageUrl,
                                       boolean veg,
                                       @Min(1) @Max(240) Integer prepMinutes) {}

    public record OpenRequest(@NotNull Boolean open) {}
}
