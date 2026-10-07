package com.zestora.promotion;

import com.zestora.common.ApiException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CouponServiceTest {
    private static BigDecimal bd(String s) { return new BigDecimal(s); }

    private final Coupon zest50 = new Coupon("ZEST50", "50% off", Coupon.Type.PERCENT, bd("50"), bd("100"), bd("299"));
    private final Coupon welcome = new Coupon("WELCOME100", "flat", Coupon.Type.FLAT, bd("100"), null, bd("399"));
    private final Coupon freeDel = new Coupon("FREEDEL", "free delivery", Coupon.Type.FREE_DELIVERY, bd("0"), null, bd("199"));

    @Test
    void percentCouponIsCappedAtMaxDiscount() {
        assertThat(CouponService.discountFor(zest50, bd("500"), BigDecimal.ZERO, Instant.now())).isEqualByComparingTo("100.00");
        assertThat(CouponService.discountFor(zest50, bd("300"), bd("40"), Instant.now())).isEqualByComparingTo("100.00");
    }

    @Test
    void rejectsBelowMinimumOrder() {
        assertThatThrownBy(() -> CouponService.discountFor(zest50, bd("298"), bd("40"), Instant.now()))
                .isInstanceOf(ApiException.class).hasMessageContaining("Minimum order");
    }

    @Test
    void flatAndFreeDeliveryCoupons() {
        assertThat(CouponService.discountFor(welcome, bd("400"), bd("40"), Instant.now())).isEqualByComparingTo("100.00");
        assertThat(CouponService.discountFor(freeDel, bd("250"), bd("40"), Instant.now())).isEqualByComparingTo("40.00");
    }

    @Test
    void expiredInactiveAndExhaustedCouponsAreRejected() {
        zest50.setValidUntil(Instant.now().minus(1, ChronoUnit.DAYS));
        assertThatThrownBy(() -> CouponService.discountFor(zest50, bd("500"), bd("0"), Instant.now())).hasMessageContaining("expired");

        welcome.setActive(false);
        assertThatThrownBy(() -> CouponService.discountFor(welcome, bd("500"), bd("0"), Instant.now())).hasMessageContaining("no longer active");

        freeDel.setUsageLimit(5);
        freeDel.setUsedCount(5);
        assertThatThrownBy(() -> CouponService.discountFor(freeDel, bd("500"), bd("40"), Instant.now())).hasMessageContaining("fully redeemed");
    }

    @Test
    void discountNeverExceedsSubtotalPlusDelivery() {
        Coupon big = new Coupon("BIG", "x", Coupon.Type.FLAT, bd("1000"), null, bd("0"));
        assertThat(CouponService.discountFor(big, bd("50"), bd("40"), Instant.now())).isEqualByComparingTo("90.00");
    }
}
