package com.zestora.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<Order> findByDeliveryPartnerIdOrderByCreatedAtDesc(Long riderUserId);

    List<Order> findByStatusAndPaymentStatusAndCreatedAtBefore(OrderStatus status, Order.PaymentStatus paymentStatus, Instant before);

    List<Order> findByStatusAndDeliveryPartnerIdIsNull(OrderStatus status);

    long countByDeliveryPartnerIdAndStatusIn(Long riderUserId, Collection<OrderStatus> statuses);

    List<Order> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);

    @Query("select coalesce(sum(o.total), 0) from Order o where o.status = com.zestora.order.OrderStatus.DELIVERED")
    BigDecimal deliveredGmv();

    @Query("select count(o) from Order o where o.status not in (com.zestora.order.OrderStatus.DELIVERED, com.zestora.order.OrderStatus.CANCELLED)")
    long activeCount();

    @Query("""
            select coalesce(sum(o.subtotal * r.commissionRate), 0)
            from Order o join Restaurant r on r.id = o.restaurantId
            where o.status = com.zestora.order.OrderStatus.DELIVERED
            """)
    BigDecimal deliveredCommission();

    @Query("select o.status, count(o) from Order o group by o.status")
    List<Object[]> countByStatus();

    @Query("select coalesce(sum(o.total), 0) from Order o where o.restaurantId = :rid and o.status = com.zestora.order.OrderStatus.DELIVERED")
    BigDecimal deliveredGmvForRestaurant(@Param("rid") Long restaurantId);
}
