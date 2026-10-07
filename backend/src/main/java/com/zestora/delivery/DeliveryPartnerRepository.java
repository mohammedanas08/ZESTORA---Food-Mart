package com.zestora.delivery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {
    Optional<DeliveryPartner> findByUserId(Long userId);

    List<DeliveryPartner> findByOnlineTrue();
}
