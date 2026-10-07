package com.zestora.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
@Getter @Setter @NoArgsConstructor
public class Payment {
    public enum Status { CREATED, PAID, FAILED, REFUNDED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orderId;
    private String provider;
    private String providerOrderId;
    private String providerPaymentId;
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    private Status status = Status.CREATED;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}
