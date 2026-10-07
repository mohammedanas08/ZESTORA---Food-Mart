package com.zestora.promotion;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter @Setter @NoArgsConstructor
public class Coupon {
    public enum Type { PERCENT, FLAT, FREE_DELIVERY }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String code;
    private String description;
    @Enumerated(EnumType.STRING)
    private Type type;
    private BigDecimal value = BigDecimal.ZERO;
    private BigDecimal maxDiscount;
    private BigDecimal minOrder = BigDecimal.ZERO;
    private boolean active = true;
    private Instant validFrom;
    private Instant validUntil;
    private Integer usageLimit;
    private int usedCount;

    public Coupon(String code, String description, Type type, BigDecimal value, BigDecimal maxDiscount, BigDecimal minOrder) {
        this.code = code;
        this.description = description;
        this.type = type;
        this.value = value;
        this.maxDiscount = maxDiscount;
        this.minOrder = minOrder;
    }
}
