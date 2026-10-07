package com.zestora.order;

import com.zestora.config.AppProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Server-authoritative pricing. The client never sends prices; the total is always computed here from database prices.
 *
 * Total = subtotal + packaging + delivery + platform fee + GST + tip - coupon discount
 *   delivery  = free when subtotal >= threshold (default ₹499), else flat fee (default ₹40)
 *   packaging = flat for food, zero for grocery
 *   GST       = rate (5%) of (subtotal + packaging)
 */
@Component
public class PricingEngine {
    public record Breakdown(BigDecimal subtotal, BigDecimal packagingFee, BigDecimal deliveryFee, BigDecimal platformFee,
                            BigDecimal tax, BigDecimal discount, BigDecimal tip, BigDecimal total) {}

    private final AppProperties.Pricing cfg;

    public PricingEngine(AppProperties props) {
        this.cfg = props.pricing();
    }

    public BigDecimal deliveryFeeFor(BigDecimal subtotal) {
        return subtotal.compareTo(cfg.freeDeliveryThreshold()) >= 0 ? BigDecimal.ZERO.setScale(2) : money(cfg.deliveryFee());
    }

    public Breakdown price(BigDecimal subtotal, boolean grocery, BigDecimal tip, BigDecimal discount) {
        subtotal = money(subtotal);
        tip = money(tip);
        discount = money(discount);
        BigDecimal packaging = grocery ? money(BigDecimal.ZERO) : money(cfg.packagingFee());
        BigDecimal delivery = deliveryFeeFor(subtotal);
        BigDecimal platform = money(cfg.platformFee());
        BigDecimal tax = money(subtotal.add(packaging).multiply(cfg.gstRate()));
        BigDecimal total = subtotal.add(packaging).add(delivery).add(platform).add(tax).add(tip).subtract(discount);
        if (total.signum() < 0) total = BigDecimal.ZERO;
        return new Breakdown(subtotal, packaging, delivery, platform, tax, discount, tip, money(total));
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
