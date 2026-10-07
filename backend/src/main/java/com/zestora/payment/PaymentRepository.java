package com.zestora.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByProviderOrderId(String providerOrderId);

    Optional<Payment> findFirstByOrderIdAndStatusOrderByIdDesc(Long orderId, Payment.Status status);

    /** Inserts the event id; returns 0 when it was already processed (idempotent webhooks). */
    @Modifying
    @Query(value = "insert into payment_events(event_id) values (:id) on conflict do nothing", nativeQuery = true)
    int recordEvent(@Param("id") String eventId);
}
