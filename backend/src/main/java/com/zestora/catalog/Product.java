package com.zestora.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** A menu item (restaurantId set) or a QuickMart grocery product (restaurantId null, grocery=true). */
@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long restaurantId;
    private String name;
    private String description;
    private String category;
    private BigDecimal price;
    private String imageUrl;
    private boolean veg = true;
    private boolean available = true;
    private boolean grocery;
    /** Grocery stock; null means unlimited (food items). */
    private Integer stock;
    private int prepMinutes = 15;
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductAddon> addons = new ArrayList<>();
}
