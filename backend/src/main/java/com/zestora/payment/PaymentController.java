package com.zestora.payment;

import com.zestora.common.ApiResponse;
import com.zestora.config.AppProperties;
import com.zestora.security.AuthUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    public record VerifyRequest(@NotBlank String razorpayOrderId, @NotBlank String razorpayPaymentId, @NotBlank String razorpaySignature) {}

    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/{orderId}/checkout")
    public ApiResponse<PaymentService.CheckoutDto> checkout(@PathVariable Long orderId) {
        return ApiResponse.ok(payments.createCheckout(AuthUser.current(), orderId));
    }

    @PostMapping("/{orderId}/verify")
    public ApiResponse<Void> verify(@PathVariable Long orderId, @Valid @RequestBody VerifyRequest req) {
        payments.verifyCheckout(AuthUser.current(), orderId, req.razorpayOrderId(), req.razorpayPaymentId(), req.razorpaySignature());
        return ApiResponse.ok(null);
    }

    /** Dev profile only; returns 404 otherwise. */
    @PostMapping("/{orderId}/simulate")
    public ApiResponse<Void> simulate(@PathVariable Long orderId) {
        payments.simulate(AuthUser.current(), orderId);
        return ApiResponse.ok(null);
    }

    @Configuration
    static class GatewayConfig {
        @Bean
        PaymentGateway paymentGateway(AppProperties props) {
            if (props.razorpay().configured()) return new RazorpayGateway(props.razorpay());
            if (props.dev().allowPaymentSimulation()) return new MockGateway();
            throw new IllegalStateException("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required when payment simulation is disabled");
        }
    }
}
