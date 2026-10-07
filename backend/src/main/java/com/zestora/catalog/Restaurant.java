package com.zestora.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "restaurants")
@Getter @Setter @NoArgsConstructor
public class Restaurant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private String name;
    private String slug;
    private String description;
    private String cuisines;
    private String imageUrl;
    private BigDecimal rating = BigDecimal.ZERO;
    private int reviewCount;
    private int deliveryMin = 25;
    private int deliveryMax = 35;
    private BigDecimal minOrder = BigDecimal.ZERO;
    private BigDecimal costForTwo;
    private boolean vegOnly;
    @Column(name = "is_open")
    private boolean open = true;
    private boolean active = true;
    private BigDecimal commissionRate = new BigDecimal("0.200");
    private String city = "Bhatkal";
    private Double lat;
    private Double lng;
    private Instant createdAt = Instant.now();
}
