package com.zestora.payment;

import java.math.BigDecimal;

/** Abstraction over the payment provider so Razorpay can be swapped (or mocked in dev) without touching business code. */
public interface PaymentGateway {
    record ProviderOrder(String providerOrderId, long amountPaise, String currency, String publicKey, boolean mock) {}

    String provider();

    ProviderOrder createOrder(String receipt, BigDecimal amountRupees);

    /** Checks the checkout callback signature (orderId|paymentId HMAC). */
    boolean verifyPaymentSignature(String providerOrderId, String providerPaymentId, String signature);

    /** Checks a webhook body against the X-Razorpay-Signature header. */
    boolean verifyWebhookSignature(String rawBody, String signature);
}
