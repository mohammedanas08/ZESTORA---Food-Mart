package com.zestora.order;

import com.zestora.config.AppProperties;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PricingEngineTest {
    private final PricingEngine engine = new PricingEngine(new AppProperties(null, null, null,
            new AppProperties.Pricing(new BigDecimal("40"), new BigDecimal("499"), new BigDecimal("5"), new BigDecimal("15"),
                    new BigDecimal("0.05")), null, null, null, null));

    private static BigDecimal bd(String s) { return new BigDecimal(s); }

    @Test
    void foodOrderAboveThresholdGetsFreeDelivery() {
        // subtotal 740 (≥ 499 → free delivery): packaging 15, platform 5, GST 5% of 755 = 37.75, tip 20, discount 50
        var b = engine.price(bd("740"), false, bd("20"), bd("50"));
        assertThat(b.packagingFee()).isEqualByComparingTo("15.00");
        assertThat(b.deliveryFee()).isEqualByComparingTo("0.00");          // 740 >= 499 → free
        assertThat(b.tax()).isEqualByComparingTo("37.75");
        assertThat(b.total()).isEqualByComparingTo("767.75");              // 740+15+0+5+37.75+20-50
    }

    @Test
    void deliveryIsChargedBelowFreeThreshold() {
        var b = engine.price(bd("300"), false, BigDecimal.ZERO, BigDecimal.ZERO);
        assertThat(b.deliveryFee()).isEqualByComparingTo("40.00");
        assertThat(b.total()).isEqualByComparingTo("375.75");               // 300+15+40+5+15.75
    }

    @Test
    void freeDeliveryExactlyAtThreshold() {
        assertThat(engine.deliveryFeeFor(bd("499"))).isEqualByComparingTo("0");
        assertThat(engine.deliveryFeeFor(bd("498.99"))).isEqualByComparingTo("40");
    }

    @Test
    void groceryHasNoPackagingFee() {
        var b = engine.price(bd("200"), true, BigDecimal.ZERO, BigDecimal.ZERO);
        assertThat(b.packagingFee()).isEqualByComparingTo("0");
        assertThat(b.tax()).isEqualByComparingTo("10.00");
        assertThat(b.total()).isEqualByComparingTo("255.00");              // 200+0+40+5+10
    }

    @Test
    void totalNeverNegative() {
        var b = engine.price(bd("100"), false, BigDecimal.ZERO, bd("10000"));
        assertThat(b.total()).isEqualByComparingTo("0");
    }
}
