package com.zestora.payment;

import java.math.BigDecimal;
import java.util.UUID;

/** Used only in dev when no Razorpay keys are configured. It can never verify a real signature. */
public class MockGateway implements PaymentGateway {
    @Override
    public String provider() { return "MOCK"; }

    @Override
    public ProviderOrder createOrder(String receipt, BigDecimal amountRupees) {
        return new ProviderOrder("order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14),
                amountRupees.movePointRight(2).longValueExact(), "INR", "rzp_test_mock", true);
    }

    @Override
    public boolean verifyPaymentSignature(String providerOrderId, String providerPaymentId, String signature) { return false; }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signature) { return false; }
}
