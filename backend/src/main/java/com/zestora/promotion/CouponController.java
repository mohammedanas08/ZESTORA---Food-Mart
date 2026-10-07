package com.zestora.promotion;

import com.zestora.common.ApiResponse;
import com.zestora.order.PricingEngine;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/coupons")
public class CouponController {
    public record CouponDto(String code, String description, Coupon.Type type, BigDecimal value,
                            BigDecimal maxDiscount, BigDecimal minOrder) {}

    public record ValidateRequest(@NotBlank String code, @NotNull BigDecimal subtotal) {}

    private final CouponService coupons;
    private final PricingEngine pricing;

    public CouponController(CouponService coupons, PricingEngine pricing) {
        this.coupons = coupons;
        this.pricing = pricing;
    }

    @GetMapping
    public ApiResponse<List<CouponDto>> list() {
        return ApiResponse.ok(coupons.activeCoupons().stream()
                .map(c -> new CouponDto(c.getCode(), c.getDescription(), c.getType(), c.getValue(), c.getMaxDiscount(), c.getMinOrder()))
                .toList());
    }

    /** Preview the discount for a subtotal. The authoritative check happens again when the order is created. */
    @PostMapping("/validate")
    public ApiResponse<CouponService.Validation> validate(@Valid @RequestBody ValidateRequest req) {
        return ApiResponse.ok(coupons.validate(req.code(), req.subtotal(), pricing.deliveryFeeFor(req.subtotal())));
    }
}
