package com.zestora.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor
public class ProductVariant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;
    private String name;
    private BigDecimal price;

    public ProductVariant(Product product, String name, BigDecimal price) {
        this.product = product;
        this.name = name;
        this.price = price;
    }
}
