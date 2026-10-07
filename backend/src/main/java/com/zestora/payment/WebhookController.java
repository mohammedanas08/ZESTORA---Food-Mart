package com.zestora.payment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Public endpoint for Razorpay; trust comes solely from the HMAC signature over the raw body. */
@RestController
@RequestMapping("/api/v1/payments/razorpay")
public class WebhookController {
    private final PaymentService payments;

    public WebhookController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String rawBody,
                                        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
                                        @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {
        payments.handleWebhook(rawBody, signature, eventId);
        return ResponseEntity.ok().build();
    }
}
