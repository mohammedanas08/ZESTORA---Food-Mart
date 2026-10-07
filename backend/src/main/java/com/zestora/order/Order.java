package com.zestora.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor
public class Order {
    public enum PaymentStatus { PENDING, PAID, FAILED, REFUND_PENDING, REFUNDED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String orderNumber;
    private Long customerId;
    /** Null for grocery orders. */
    private Long restaurantId;
    private boolean grocery;
    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PLACED;
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private String paymentMethod = "UPI";

    private BigDecimal subtotal;
    private BigDecimal packagingFee;
    private BigDecimal deliveryFee;
    private BigDecimal platformFee;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal tip;
    private BigDecimal total;
    private String couponCode;

    @Column(name = "addr_street") private String addrStreet;
    @Column(name = "addr_area") private String addrArea;
    @Column(name = "addr_city") private String addrCity;
    @Column(name = "addr_pincode") private String addrPincode;
    @Column(name = "addr_instructions") private String addrInstructions;
    @Column(name = "addr_lat") private Double addrLat;
    @Column(name = "addr_lng") private Double addrLng;
    private String customerPhone;

    /** The rider's user id. */
    private Long deliveryPartnerId;
    private String rejectionReason;
    /** 4-digit code the customer reads out to the rider to complete delivery. */
    private String deliveryOtp;

    @Version
    private long version;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<OrderStatusHistory> history = new ArrayList<>();

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public void addHistory(OrderStatus s, Long actorId, String actorRole, String note) {
        history.add(new OrderStatusHistory(this, s, actorId, actorRole, note));
    }
}
