package com.zestora.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "delivery_partners")
@Getter @Setter @NoArgsConstructor
public class DeliveryPartner {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String vehicleType;
    private String vehicleNumber;
    private boolean online;
    private BigDecimal rating = new BigDecimal("5.00");
    private int totalTrips;
    private BigDecimal walletBalance = BigDecimal.ZERO;
    private Double lat;
    private Double lng;
    private Instant locationAt;
}
