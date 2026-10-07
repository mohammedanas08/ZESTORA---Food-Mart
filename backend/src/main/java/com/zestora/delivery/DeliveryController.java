package com.zestora.delivery;

import com.zestora.common.ApiResponse;
import com.zestora.security.AuthUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rider")
public class DeliveryController {
    public record StatusRequest(@NotNull Boolean online) {}

    public record LocationRequest(@NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
                                  @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng) {}

    private final DeliveryService delivery;

    public DeliveryController(DeliveryService delivery) {
        this.delivery = delivery;
    }

    @GetMapping("/profile")
    public ApiResponse<DeliveryService.ProfileDto> profile() {
        return ApiResponse.ok(delivery.profile(AuthUser.current()));
    }

    @PutMapping("/status")
    public ApiResponse<DeliveryService.ProfileDto> status(@Valid @RequestBody StatusRequest req) {
        return ApiResponse.ok(delivery.setOnline(AuthUser.current(), req.online()));
    }

    @PostMapping("/location")
    public ApiResponse<Void> location(@Valid @RequestBody LocationRequest req) {
        delivery.updateLocation(AuthUser.current(), req.lat(), req.lng());
        return ApiResponse.ok(null);
    }
}
