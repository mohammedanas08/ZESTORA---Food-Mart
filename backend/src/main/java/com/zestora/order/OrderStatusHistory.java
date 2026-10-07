package com.zestora.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "order_status_history")
@Getter @Setter @NoArgsConstructor
public class OrderStatusHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private Order order;
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    private Long actorId;
    private String actorRole;
    private String note;
    private Instant createdAt = Instant.now();

    public OrderStatusHistory(Order order, OrderStatus status, Long actorId, String actorRole, String note) {
        this.order = order;
        this.status = status;
        this.actorId = actorId;
        this.actorRole = actorRole;
        this.note = note;
    }
}
