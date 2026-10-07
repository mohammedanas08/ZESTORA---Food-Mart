package com.zestora.delivery;

import com.zestora.common.ApiException;
import com.zestora.order.OrderRepository;
import com.zestora.order.OrderStatus;
import com.zestora.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

@Service
public class DeliveryService {
    /** Statuses in which a rider is considered busy with an order. */
    public static final Set<OrderStatus> ACTIVE = EnumSet.of(OrderStatus.DELIVERY_ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY);

    public record ProfileDto(boolean online, int totalTrips, BigDecimal walletBalance, BigDecimal rating,
                             String vehicleType, String vehicleNumber) {}

    private final DeliveryPartnerRepository partners;
    private final OrderRepository orders;

    public DeliveryService(DeliveryPartnerRepository partners, OrderRepository orders) {
        this.partners = partners;
        this.orders = orders;
    }

    @Transactional(readOnly = true)
    public ProfileDto profile(AuthUser user) {
        return toDto(partnerOf(user));
    }

    @Transactional
    public ProfileDto setOnline(AuthUser user, boolean online) {
        DeliveryPartner p = partnerOf(user);
        p.setOnline(online);
        return toDto(p);
    }

    @Transactional
    public void updateLocation(AuthUser user, double lat, double lng) {
        DeliveryPartner p = partnerOf(user);
        p.setLat(lat);
        p.setLng(lng);
        p.setLocationAt(Instant.now());
    }

    /** Least-busy online rider (ties broken by fewest lifetime trips). Empty when nobody is online/free. */
    @Transactional(readOnly = true)
    public Optional<Long> pickRider() {
        return partners.findByOnlineTrue().stream()
                .filter(p -> orders.countByDeliveryPartnerIdAndStatusIn(p.getUserId(), ACTIVE) < 2)
                .min(Comparator.comparingLong((DeliveryPartner p) -> orders.countByDeliveryPartnerIdAndStatusIn(p.getUserId(), ACTIVE))
                        .thenComparingInt(DeliveryPartner::getTotalTrips))
                .map(DeliveryPartner::getUserId);
    }

    @Transactional
    public void creditDelivery(Long riderUserId, BigDecimal amount) {
        partners.findByUserId(riderUserId).ifPresent(p -> {
            p.setTotalTrips(p.getTotalTrips() + 1);
            p.setWalletBalance(p.getWalletBalance().add(amount));
        });
    }

    @Transactional(readOnly = true)
    public Optional<DeliveryPartner> findByUserId(Long userId) {
        return partners.findByUserId(userId);
    }

    private DeliveryPartner partnerOf(AuthUser user) {
        return partners.findByUserId(user.id()).orElseThrow(() -> ApiException.forbidden("No rider profile for this account"));
    }

    private static ProfileDto toDto(DeliveryPartner p) {
        return new ProfileDto(p.isOnline(), p.getTotalTrips(), p.getWalletBalance(), p.getRating(), p.getVehicleType(), p.getVehicleNumber());
    }
}
