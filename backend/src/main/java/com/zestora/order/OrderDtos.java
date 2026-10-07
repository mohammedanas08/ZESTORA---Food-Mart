package com.zestora.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    public record ItemRequest(@NotNull Long productId,
                              @Min(1) @Max(50) int quantity,
                              Long variantId,
                              @Size(max = 10) List<Long> addonIds,
                              @Size(max = 250) String notes) {}

    public record AddressRequest(@NotBlank @Size(max = 250) String street,
                                 @Size(max = 120) String area,
                                 @NotBlank @Size(max = 80) String city,
                                 @Pattern(regexp = "^[0-9]{6}$", message = "pincode must be 6 digits") String pincode,
                                 @Size(max = 250) String instructions,
                                 Double lat, Double lng) {}

    /** Note: no prices, totals or restaurant/grocery flag here; the server derives everything from the product ids. */
    public record CreateOrderRequest(@NotEmpty @Size(max = 50) List<@Valid ItemRequest> items,
                                     @NotNull @Valid AddressRequest address,
                                     @Pattern(regexp = "UPI|CARD|NETBANKING|COD") String paymentMethod,
                                     @Size(max = 40) String couponCode,
                                     @DecimalMin("0") @DecimalMax("500") BigDecimal tip) {}

    public record StatusRequest(@NotNull OrderStatus status, @Size(max = 250) String note, @Size(max = 6) String otp) {}

    public record ItemDto(Long productId, String name, String variantName, String addons, BigDecimal unitPrice,
                          int quantity, BigDecimal lineTotal, String notes) {}

    public record HistoryDto(OrderStatus status, String actorRole, String note, Instant at) {}

    public record RiderDto(String name, String phone, Double lat, Double lng) {}

    public record AddressDto(String street, String area, String city, String pincode, String instructions, Double lat, Double lng) {}

    public record OrderDto(Long id, String orderNumber, OrderStatus status, Order.PaymentStatus paymentStatus, String paymentMethod,
                           boolean grocery, Long restaurantId, String restaurantName, List<ItemDto> items,
                           BigDecimal subtotal, BigDecimal packagingFee, BigDecimal deliveryFee, BigDecimal platformFee,
                           BigDecimal tax, BigDecimal discount, BigDecimal tip, BigDecimal total, String couponCode,
                           AddressDto address, String customerName, String customerPhone, RiderDto rider,
                           String deliveryOtp, String rejectionReason, List<HistoryDto> history,
                           Instant createdAt, Instant updatedAt) {}
}
