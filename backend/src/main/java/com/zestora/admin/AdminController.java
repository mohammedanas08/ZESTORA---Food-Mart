package com.zestora.admin;

import com.zestora.catalog.Restaurant;
import com.zestora.catalog.RestaurantRepository;
import com.zestora.common.ApiException;
import com.zestora.common.ApiResponse;
import com.zestora.common.AuditLog;
import com.zestora.common.AuditService;
import com.zestora.delivery.DeliveryPartner;
import com.zestora.delivery.DeliveryPartnerRepository;
import com.zestora.order.OrderRepository;
import com.zestora.promotion.Coupon;
import com.zestora.promotion.CouponRepository;
import com.zestora.security.AuthUser;
import com.zestora.user.Role;
import com.zestora.user.User;
import com.zestora.user.UserDto;
import com.zestora.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Platform administration. Everything under /api/v1/admin/** is restricted to ADMIN / SUPER_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    public record CreateStaffRequest(@NotBlank @Size(max = 120) String name,
                                     @NotBlank @Email String email,
                                     @Size(max = 20) String phone,
                                     @NotBlank @Size(min = 8, max = 72) String password,
                                     @NotNull Role role) {}

    public record CreateRestaurantRequest(@NotNull Long ownerUserId, @NotBlank @Size(max = 150) String name,
                                          @Size(max = 500) String description, @Size(max = 300) String cuisines,
                                          @Size(max = 500) String imageUrl, boolean vegOnly,
                                          @DecimalMin("0") @DecimalMax("0.5") BigDecimal commissionRate) {}

    public record CreateRiderRequest(@NotNull Long userId, @Size(max = 60) String vehicleType, @Size(max = 30) String vehicleNumber) {}

    public record CreateCouponRequest(@NotBlank @Pattern(regexp = "^[A-Za-z0-9_-]{3,40}$") String code,
                                      @Size(max = 200) String description, @NotNull Coupon.Type type,
                                      @NotNull @DecimalMin("0") BigDecimal value, @DecimalMin("0") BigDecimal maxDiscount,
                                      @NotNull @DecimalMin("0") BigDecimal minOrder, Instant validUntil, @Min(1) Integer usageLimit) {}

    public record ActiveRequest(@NotNull Boolean active) {}

    private final OrderRepository orders;
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final DeliveryPartnerRepository riders;
    private final CouponRepository coupons;
    private final AuditService audit;
    private final PasswordEncoder encoder;

    public AdminController(OrderRepository orders, UserRepository users, RestaurantRepository restaurants,
                           DeliveryPartnerRepository riders, CouponRepository coupons, AuditService audit, PasswordEncoder encoder) {
        this.orders = orders;
        this.users = users;
        this.restaurants = restaurants;
        this.riders = riders;
        this.coupons = coupons;
        this.audit = audit;
        this.encoder = encoder;
    }

    @GetMapping("/metrics")
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> metrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("gmv", orders.deliveredGmv());
        m.put("platformCommission", orders.deliveredCommission());
        m.put("activeOrders", orders.activeCount());
        Map<String, Long> byStatus = new LinkedHashMap<>();
        orders.countByStatus().forEach(r -> byStatus.put(String.valueOf(r[0]), ((Number) r[1]).longValue()));
        m.put("ordersByStatus", byStatus);
        m.put("restaurants", restaurants.count());
        m.put("ridersOnline", riders.findByOnlineTrue().size());
        m.put("users", users.count());
        return ApiResponse.ok(m);
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public ApiResponse<List<UserDto>> users(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(users.findAll(PageRequest.of(page, Math.min(size, 100), Sort.by("id").descending()))
                .stream().map(UserDto::of).toList());
    }

    @GetMapping("/audit-logs")
    public ApiResponse<List<AuditLog>> audit(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(audit.recent(page, size).getContent());
    }

    /** Staff accounts (restaurant, rider, support, admin) are created here; public registration is customer-only. */
    @PostMapping("/users")
    @Transactional
    public ApiResponse<UserDto> createStaff(@Valid @RequestBody CreateStaffRequest req) {
        AuthUser actor = AuthUser.current();
        if (req.role().isAdmin() && actor.role() != Role.SUPER_ADMIN) {
            throw ApiException.forbidden("Only a SUPER_ADMIN can create admin accounts");
        }
        if (users.existsByEmailIgnoreCase(req.email())) throw ApiException.conflict("Email already in use");
        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(req.email().trim().toLowerCase());
        u.setPhone(req.phone());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(req.role());
        users.save(u);
        audit.record(actor, "STAFF_CREATED", "User", u.getId(), u.getEmail() + " as " + u.getRole());
        return ApiResponse.ok(UserDto.of(u));
    }

    @PostMapping("/restaurants")
    @Transactional
    public ApiResponse<Long> createRestaurant(@Valid @RequestBody CreateRestaurantRequest req) {
        User owner = users.findById(req.ownerUserId()).orElseThrow(() -> ApiException.notFound("Owner user not found"));
        if (!owner.getRole().isRestaurantStaff()) throw ApiException.badRequest("Owner must have a RESTAURANT_OWNER or RESTAURANT_MANAGER role");
        if (restaurants.findByOwnerId(owner.getId()).isPresent()) throw ApiException.conflict("This user already owns a restaurant");
        Restaurant r = new Restaurant();
        r.setOwnerId(owner.getId());
        r.setName(req.name());
        r.setSlug(req.name().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "") + "-" + System.currentTimeMillis() % 10000);
        r.setDescription(req.description());
        r.setCuisines(req.cuisines());
        r.setImageUrl(req.imageUrl());
        r.setVegOnly(req.vegOnly());
        if (req.commissionRate() != null) r.setCommissionRate(req.commissionRate());
        restaurants.save(r);
        audit.record(AuthUser.current(), "RESTAURANT_CREATED", "Restaurant", r.getId(), r.getName());
        return ApiResponse.ok(r.getId());
    }

    @PostMapping("/riders")
    @Transactional
    public ApiResponse<Long> createRider(@Valid @RequestBody CreateRiderRequest req) {
        User u = users.findById(req.userId()).orElseThrow(() -> ApiException.notFound("User not found"));
        if (u.getRole() != Role.DELIVERY_PARTNER) throw ApiException.badRequest("User must have the DELIVERY_PARTNER role");
        if (riders.findByUserId(u.getId()).isPresent()) throw ApiException.conflict("Rider profile already exists");
        DeliveryPartner p = new DeliveryPartner();
        p.setUserId(u.getId());
        p.setVehicleType(req.vehicleType());
        p.setVehicleNumber(req.vehicleNumber());
        riders.save(p);
        audit.record(AuthUser.current(), "RIDER_CREATED", "DeliveryPartner", p.getId(), u.getEmail());
        return ApiResponse.ok(p.getId());
    }

    @PostMapping("/coupons")
    @Transactional
    public ApiResponse<Long> createCoupon(@Valid @RequestBody CreateCouponRequest req) {
        if (coupons.findByCodeIgnoreCase(req.code()).isPresent()) throw ApiException.conflict("Coupon code already exists");
        Coupon c = new Coupon(req.code().toUpperCase(), req.description(), req.type(), req.value(), req.maxDiscount(), req.minOrder());
        c.setValidUntil(req.validUntil());
        c.setUsageLimit(req.usageLimit());
        coupons.save(c);
        audit.record(AuthUser.current(), "COUPON_CREATED", "Coupon", c.getId(), c.getCode());
        return ApiResponse.ok(c.getId());
    }

    @PatchMapping("/coupons/{id}/active")
    @Transactional
    public ApiResponse<Void> setCouponActive(@PathVariable Long id, @Valid @RequestBody ActiveRequest req) {
        Coupon c = coupons.findById(id).orElseThrow(() -> ApiException.notFound("Coupon not found"));
        c.setActive(req.active());
        audit.record(AuthUser.current(), req.active() ? "COUPON_ENABLED" : "COUPON_DISABLED", "Coupon", c.getId(), c.getCode());
        return ApiResponse.ok(null);
    }
}
