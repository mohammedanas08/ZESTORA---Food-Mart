package com.zestora.promotion;

import com.zestora.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class CouponService {
    public record Validation(String code, String description, BigDecimal discount) {}

    private final CouponRepository coupons;

    public CouponService(CouponRepository coupons) {
        this.coupons = coupons;
    }

    @Transactional(readOnly = true)
    public List<Coupon> activeCoupons() {
        return coupons.findByActiveTrueOrderByCodeAsc();
    }

    @Transactional(readOnly = true)
    public Validation validate(String code, BigDecimal subtotal, BigDecimal deliveryFee) {
        Coupon c = coupons.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> ApiException.badRequest("Invalid coupon code"));
        return new Validation(c.getCode(), c.getDescription(), discountFor(c, subtotal, deliveryFee, Instant.now()));
    }

    /** Validates the coupon and atomically consumes one use. Called while creating an order. */
    @Transactional
    public Validation redeem(String code, BigDecimal subtotal, BigDecimal deliveryFee) {
        Coupon c = coupons.lockByCode(code.trim()).orElseThrow(() -> ApiException.badRequest("Invalid coupon code"));
        BigDecimal discount = discountFor(c, subtotal, deliveryFee, Instant.now());
        c.setUsedCount(c.getUsedCount() + 1);
        return new Validation(c.getCode(), c.getDescription(), discount);
    }

    /** Pure rule evaluation (no I/O) so it is trivially unit-testable. */
    public static BigDecimal discountFor(Coupon c, BigDecimal subtotal, BigDecimal deliveryFee, Instant now) {
        if (!c.isActive()) throw ApiException.badRequest("This coupon is no longer active");
        if (c.getValidFrom() != null && now.isBefore(c.getValidFrom())) throw ApiException.badRequest("This coupon is not valid yet");
        if (c.getValidUntil() != null && now.isAfter(c.getValidUntil())) throw ApiException.badRequest("This coupon has expired");
        if (c.getUsageLimit() != null && c.getUsedCount() >= c.getUsageLimit()) throw ApiException.badRequest("This coupon has been fully redeemed");
        if (subtotal.compareTo(c.getMinOrder()) < 0) {
            throw ApiException.badRequest("Minimum order for this coupon is ₹" + c.getMinOrder().stripTrailingZeros().toPlainString());
        }
        BigDecimal discount = switch (c.getType()) {
            case PERCENT -> subtotal.multiply(c.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case FLAT -> c.getValue();
            case FREE_DELIVERY -> deliveryFee;
        };
        if (c.getMaxDiscount() != null && discount.compareTo(c.getMaxDiscount()) > 0) discount = c.getMaxDiscount();
        BigDecimal ceiling = subtotal.add(deliveryFee);                      // never discount below zero
        if (discount.compareTo(ceiling) > 0) discount = ceiling;
        return discount.setScale(2, RoundingMode.HALF_UP);
    }
}
