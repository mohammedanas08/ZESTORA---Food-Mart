package com.zestora.order;

import com.zestora.common.ApiResponse;
import com.zestora.order.OrderDtos.*;
import com.zestora.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class OrderController {
    private final OrderService orders;

    public OrderController(OrderService orders) {
        this.orders = orders;
    }

    @PostMapping("/orders")
    public ApiResponse<OrderDto> create(@Valid @RequestBody CreateOrderRequest req) {
        return ApiResponse.ok(orders.create(AuthUser.current(), req));
    }

    @GetMapping("/orders/me")
    public ApiResponse<List<OrderDto>> mine() {
        return ApiResponse.ok(orders.mine(AuthUser.current()));
    }

    @GetMapping("/orders/{id}")
    public ApiResponse<OrderDto> get(@PathVariable Long id) {
        return ApiResponse.ok(orders.get(AuthUser.current(), id));
    }

    @PatchMapping("/orders/{id}/status")
    public ApiResponse<OrderDto> status(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return ApiResponse.ok(orders.changeStatus(AuthUser.current(), id, req));
    }

    // ── restaurant partner ──
    @GetMapping("/partner/orders")
    public ApiResponse<List<OrderDto>> partnerOrders() {
        return ApiResponse.ok(orders.forRestaurant(AuthUser.current()));
    }

    // ── rider ──
    @GetMapping("/rider/orders")
    public ApiResponse<List<OrderDto>> riderOrders() {
        return ApiResponse.ok(orders.forRider(AuthUser.current()));
    }

    // ── admin ──
    @GetMapping("/admin/orders")
    public ApiResponse<List<OrderDto>> adminOrders(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(orders.recentForAdmin(page, size));
    }
}
