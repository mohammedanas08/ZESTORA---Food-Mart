package com.zestora.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.math.BigDecimal;
import java.util.List;

/** Typed binding of the {@code zestora.*} section of application.yml. */
@ConfigurationProperties(prefix = "zestora")
public record AppProperties(
        @DefaultValue Jwt jwt,
        @DefaultValue Cors cors,
        @DefaultValue Cookie cookie,
        @DefaultValue Pricing pricing,
        @DefaultValue Razorpay razorpay,
        @DefaultValue Cloudinary cloudinary,
        @DefaultValue RateLimit rateLimit,
        @DefaultValue Dev dev) {

    public record Jwt(String secret, @DefaultValue("15") long accessTtlMinutes, @DefaultValue("14") long refreshTtlDays) {}

    public record Cors(@DefaultValue("http://localhost:3000") List<String> allowedOrigins) {}

    public record Cookie(@DefaultValue("false") boolean secure) {}

    public record Pricing(
            @DefaultValue("40") BigDecimal deliveryFee,
            @DefaultValue("499") BigDecimal freeDeliveryThreshold,
            @DefaultValue("5") BigDecimal platformFee,
            @DefaultValue("15") BigDecimal packagingFee,
            @DefaultValue("0.05") BigDecimal gstRate) {}

    public record Razorpay(String keyId, String keySecret, String webhookSecret) {
        public boolean configured() {
            return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
        }
    }

    public record Cloudinary(String cloudName, String apiKey, String apiSecret) {
        public boolean configured() {
            return cloudName != null && !cloudName.isBlank() && apiKey != null && !apiKey.isBlank()
                    && apiSecret != null && !apiSecret.isBlank();
        }
    }

    public record RateLimit(@DefaultValue("10") int authPerMinute) {}

    public record Dev(@DefaultValue("false") boolean seedDemoData,
                      @DefaultValue("false") boolean allowPaymentSimulation,
                      /** Adds the hand-entered restaurants from seed/curated-restaurants.json. Dev only; off in tests. */
                      @DefaultValue("false") boolean seedBhatkal,
                      /** The six made-up sample restaurants (used as fixtures by the tests). Off in the bhatkal profile. */
                      @DefaultValue("true") boolean seedSampleRestaurants,
                      /** Password given to every seeded demo account. Comes from DEMO_PASSWORD; never hard-coded. */
                      String demoPassword) {}
}
