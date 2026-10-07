package com.zestora.payment;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.zestora.common.ApiException;
import com.zestora.config.AppProperties;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

public class RazorpayGateway implements PaymentGateway {
    private final AppProperties.Razorpay cfg;
    private final RazorpayClient client;

    public RazorpayGateway(AppProperties.Razorpay cfg) {
        this.cfg = cfg;
        try {
            this.client = new RazorpayClient(cfg.keyId(), cfg.keySecret());
        } catch (RazorpayException e) {
            throw new IllegalStateException("Could not initialise Razorpay client", e);
        }
    }

    @Override
    public String provider() { return "RAZORPAY"; }

    @Override
    public ProviderOrder createOrder(String receipt, BigDecimal amountRupees) {
        long paise = amountRupees.movePointRight(2).longValueExact();
        try {
            JSONObject req = new JSONObject();
            req.put("amount", paise);
            req.put("currency", "INR");
            req.put("receipt", receipt);
            com.razorpay.Order order = client.orders.create(req);
            return new ProviderOrder(order.get("id"), paise, "INR", cfg.keyId(), false);
        } catch (RazorpayException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Could not start the payment. Please try again.");
        }
    }

    @Override
    public boolean verifyPaymentSignature(String providerOrderId, String providerPaymentId, String signature) {
        return hmacMatches(cfg.keySecret(), providerOrderId + "|" + providerPaymentId, signature);
    }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signature) {
        if (cfg.webhookSecret() == null || cfg.webhookSecret().isBlank()) return false;   // fail closed
        return hmacMatches(cfg.webhookSecret(), rawBody, signature);
    }

    static boolean hmacMatches(String secret, String data, String signature) {
        if (signature == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }
}
