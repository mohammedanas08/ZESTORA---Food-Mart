package com.zestora.order;

import com.zestora.catalog.*;
import com.zestora.common.ApiException;
import com.zestora.common.AuditService;
import com.zestora.delivery.DeliveryService;
import com.zestora.order.OrderDtos.*;
import com.zestora.promotion.CouponService;
import com.zestora.realtime.OrderEvent;
import com.zestora.security.AuthUser;
import com.zestora.user.Role;
import com.zestora.user.User;
import com.zestora.user.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final OrderRepository orders;
    private final ProductRepository products;
    private final RestaurantRepository restaurants;
    private final UserRepository users;
    private final PricingEngine pricing;
    private final CouponService coupons;
    private final DeliveryService delivery;
    private final OrderAccess access;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public OrderService(OrderRepository orders, ProductRepository products, RestaurantRepository restaurants,
                        UserRepository users, PricingEngine pricing, CouponService coupons, DeliveryService delivery,
                        OrderAccess access, AuditService audit, ApplicationEventPublisher events) {
        this.orders = orders;
        this.products = products;
        this.restaurants = restaurants;
        this.users = users;
        this.pricing = pricing;
        this.coupons = coupons;
        this.delivery = delivery;
        this.access = access;
        this.audit = audit;
        this.events = events;
    }

    // ───────────────────────────── create ─────────────────────────────

    @Transactional
    public OrderDto create(AuthUser user, CreateOrderRequest req) {
        if (user.role() != Role.CUSTOMER) throw ApiException.forbidden("Only customers can place orders");
        User customer = users.findById(user.id()).orElseThrow(() -> ApiException.unauthorized("Unknown user"));

        // Lock the product rows so concurrent orders cannot oversell grocery stock.
        Set<Long> ids = req.items().stream().map(ItemRequest::productId).collect(Collectors.toCollection(TreeSet::new));
        Map<Long, Product> byId = products.lockAllById(ids).stream().collect(Collectors.toMap(Product::getId, p -> p));
        if (byId.size() != ids.size()) throw ApiException.badRequest("One or more items no longer exist");

        boolean grocery = byId.values().iterator().next().isGrocery();
        Long restaurantId = byId.values().iterator().next().getRestaurantId();
        for (Product p : byId.values()) {
            if (p.isGrocery() != grocery || !Objects.equals(p.getRestaurantId(), restaurantId)) {
                throw ApiException.badRequest("An order can only contain items from one restaurant, or only grocery items. Please place separate orders.");
            }
        }
        Restaurant restaurant = null;
        if (!grocery) {
            restaurant = restaurants.findById(restaurantId).filter(Restaurant::isActive)
                    .orElseThrow(() -> ApiException.badRequest("Restaurant is unavailable"));
            if (!restaurant.isOpen()) throw ApiException.conflict(restaurant.getName() + " is currently closed");
        }

        Order o = new Order();
        o.setCustomerId(user.id());
        o.setCustomerPhone(customer.getPhone());
        o.setRestaurantId(restaurantId);
        o.setGrocery(grocery);
        o.setPaymentMethod(req.paymentMethod() == null ? "UPI" : req.paymentMethod());

        // Merge duplicate product lines for stock accounting.
        Map<Long, Integer> qtyByProduct = new HashMap<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (ItemRequest ir : req.items()) {
            Product p = byId.get(ir.productId());
            if (!p.isAvailable()) throw ApiException.conflict(p.getName() + " is currently unavailable");
            if (p.getPrice() == null && ir.variantId() == null) {
                throw ApiException.conflict(p.getName() + " has no listed price yet. Please ask the restaurant.");
            }
            BigDecimal unit = p.getPrice();
            String variantName = null;
            if (ir.variantId() != null) {
                ProductVariant v = p.getVariants().stream().filter(x -> x.getId().equals(ir.variantId())).findFirst()
                        .orElseThrow(() -> ApiException.badRequest("Invalid variant for " + p.getName()));
                unit = v.getPrice();
                variantName = v.getName();
            }
            List<String> addonNames = new ArrayList<>();
            if (ir.addonIds() != null) {
                for (Long aid : new LinkedHashSet<>(ir.addonIds())) {
                    ProductAddon a = p.getAddons().stream().filter(x -> x.getId().equals(aid)).findFirst()
                            .orElseThrow(() -> ApiException.badRequest("Invalid add-on for " + p.getName()));
                    unit = unit.add(a.getPrice());
                    addonNames.add(a.getName());
                }
            }
            BigDecimal line = unit.multiply(BigDecimal.valueOf(ir.quantity()));
            subtotal = subtotal.add(line);
            qtyByProduct.merge(p.getId(), ir.quantity(), Integer::sum);

            OrderItem item = new OrderItem();
            item.setOrder(o);
            item.setProductId(p.getId());
            item.setName(p.getName());
            item.setVariantName(variantName);
            item.setAddons(addonNames.isEmpty() ? null : String.join(", ", addonNames));
            item.setUnitPrice(unit);
            item.setQuantity(ir.quantity());
            item.setLineTotal(line);
            item.setNotes(ir.notes());
            o.getItems().add(item);
        }

        if (grocery) {
            qtyByProduct.forEach((pid, qty) -> {
                Product p = byId.get(pid);
                if (p.getStock() != null) {
                    if (p.getStock() < qty) throw ApiException.conflict("Only " + p.getStock() + " left of " + p.getName());
                    p.setStock(p.getStock() - qty);
                }
            });
        } else if (subtotal.compareTo(restaurant.getMinOrder()) < 0) {
            throw ApiException.badRequest("Minimum order for " + restaurant.getName() + " is ₹" + restaurant.getMinOrder().stripTrailingZeros().toPlainString());
        }

        BigDecimal discount = BigDecimal.ZERO;
        if (req.couponCode() != null && !req.couponCode().isBlank()) {
            discount = coupons.redeem(req.couponCode(), subtotal, pricing.deliveryFeeFor(subtotal)).discount();
            o.setCouponCode(req.couponCode().trim().toUpperCase());
        }
        var b = pricing.price(subtotal, grocery, req.tip() == null ? BigDecimal.ZERO : req.tip(), discount);
        o.setSubtotal(b.subtotal());
        o.setPackagingFee(b.packagingFee());
        o.setDeliveryFee(b.deliveryFee());
        o.setPlatformFee(b.platformFee());
        o.setTax(b.tax());
        o.setDiscount(b.discount());
        o.setTip(b.tip());
        o.setTotal(b.total());

        AddressRequest a = req.address();
        o.setAddrStreet(a.street());
        o.setAddrArea(a.area());
        o.setAddrCity(a.city());
        o.setAddrPincode(a.pincode());
        o.setAddrInstructions(a.instructions());
        o.setAddrLat(a.lat());
        o.setAddrLng(a.lng());

        o.setOrderNumber("ZES-" + LocalDate.now(ZoneOffset.UTC).format(DAY) + "-" + (100000 + RANDOM.nextInt(900000)));
        o.setDeliveryOtp(String.format("%04d", RANDOM.nextInt(10000)));
        o.addHistory(OrderStatus.PLACED, user.id(), user.role().name(), "Order placed");
        orders.save(o);

        audit.record(user, "ORDER_PLACED", "Order", o.getId(), o.getOrderNumber() + " total=" + o.getTotal());
        publish(o);
        return toDto(o, user);
    }

    // ───────────────────────────── read ─────────────────────────────

    @Transactional(readOnly = true)
    public OrderDto get(AuthUser user, Long id) {
        Order o = orders.findById(id).orElseThrow(() -> ApiException.notFound("Order not found"));
        access.assertCanView(user, o);
        return toDto(o, user);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> mine(AuthUser user) {
        return orders.findByCustomerIdOrderByCreatedAtDesc(user.id()).stream().map(o -> toDto(o, user)).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDto> forRestaurant(AuthUser user) {
        Restaurant r = restaurants.findByOwnerId(user.id()).orElseThrow(() -> ApiException.forbidden("No restaurant is linked to this account"));
        // The kitchen never sees unpaid (PLACED) orders.
        return orders.findByRestaurantIdOrderByCreatedAtDesc(r.getId()).stream()
                .filter(o -> o.getStatus() != OrderStatus.PLACED)
                .map(o -> toDto(o, user)).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDto> forRider(AuthUser user) {
        return orders.findByDeliveryPartnerIdOrderByCreatedAtDesc(user.id()).stream().map(o -> toDto(o, user)).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDto> recentForAdmin(int page, int size) {
        return orders.findAllByOrderByCreatedAtDesc(PageRequest.of(page, Math.min(size, 100))).stream()
                .map(o -> toDto(o, new AuthUser(0L, "admin", Role.ADMIN))).toList();
    }

    // ───────────────────────────── status changes ─────────────────────────────

    @Transactional
    public OrderDto changeStatus(AuthUser user, Long id, StatusRequest req) {
        Order o = orders.findById(id).orElseThrow(() -> ApiException.notFound("Order not found"));
        access.assertCanView(user, o);                                         // ownership (404 for outsiders)
        OrderStateMachine.assertAllowed(user.role(), o.getStatus(), req.status(), false);

        if (user.role() == Role.DELIVERY_PARTNER && req.status() == OrderStatus.DELIVERED) {
            if (req.otp() == null || !req.otp().equals(o.getDeliveryOtp())) {
                throw ApiException.badRequest("Incorrect delivery code. Ask the customer for the 4-digit code.");
            }
        }
        if (req.status() == OrderStatus.CANCELLED && user.role().isRestaurantStaff()) {
            o.setRejectionReason(req.note());
        }
        applyTransition(o, req.status(), user, req.note());
        audit.record(user, "ORDER_" + req.status(), "Order", o.getId(), o.getOrderNumber());
        return toDto(o, user);
    }

    /** Called by the payment flow once the provider confirms payment. Idempotent. */
    @Transactional
    public void markPaid(Long orderId) {
        Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (o.getPaymentStatus() == Order.PaymentStatus.PAID) return;
        if (o.getStatus() != OrderStatus.PLACED) {
            // Paid after cancellation/expiry: keep the money flagged for refund instead of resurrecting the order.
            o.setPaymentStatus(Order.PaymentStatus.REFUND_PENDING);
            audit.record(null, "PAYMENT_AFTER_CANCEL", "Order", o.getId(), o.getOrderNumber());
            return;
        }
        o.setPaymentStatus(Order.PaymentStatus.PAID);
        applyTransition(o, OrderStatus.CONFIRMED, null, "Payment verified");
        audit.record(null, "PAYMENT_CONFIRMED", "Order", o.getId(), o.getOrderNumber());
    }

    /** Assign waiting READY orders to a free rider. Runs on a schedule and right after an order becomes ready. */
    @Transactional
    public int dispatchPending() {
        int assigned = 0;
        for (Order o : orders.findByStatusAndDeliveryPartnerIdIsNull(OrderStatus.READY_FOR_PICKUP)) {
            if (tryDispatch(o)) assigned++;
        }
        return assigned;
    }

    /** Unpaid orders are cancelled after 30 minutes and their grocery stock is released. */
    @Transactional
    public int expireUnpaid() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.MINUTES);
        List<Order> stale = orders.findByStatusAndPaymentStatusAndCreatedAtBefore(OrderStatus.PLACED, Order.PaymentStatus.PENDING, cutoff);
        for (Order o : stale) applyTransition(o, OrderStatus.CANCELLED, null, "Payment not completed in time");
        return stale.size();
    }

    // ───────────────────────────── internals ─────────────────────────────

    private void applyTransition(Order o, OrderStatus to, AuthUser actor, String note) {
        OrderStateMachine.assertAllowed(actor == null ? Role.ADMIN : actor.role(), o.getStatus(), to, actor == null);
        o.setStatus(to);
        o.addHistory(to, actor == null ? null : actor.id(), actor == null ? "SYSTEM" : actor.role().name(), note);

        switch (to) {
            case CANCELLED -> {
                releaseStock(o);
                if (o.getPaymentStatus() == Order.PaymentStatus.PAID) o.setPaymentStatus(Order.PaymentStatus.REFUND_PENDING);
            }
            case DELIVERED -> delivery.creditDelivery(o.getDeliveryPartnerId(), o.getDeliveryFee().add(o.getTip()));
            default -> { }
        }
        publish(o);
        if (to == OrderStatus.READY_FOR_PICKUP) tryDispatch(o);
    }

    private boolean tryDispatch(Order o) {
        Optional<Long> rider = delivery.pickRider();
        if (rider.isEmpty()) return false;
        o.setDeliveryPartnerId(rider.get());
        o.setStatus(OrderStatus.DELIVERY_ASSIGNED);
        o.addHistory(OrderStatus.DELIVERY_ASSIGNED, null, "SYSTEM", "Rider assigned");
        publish(o);
        return true;
    }

    private void releaseStock(Order o) {
        if (!o.isGrocery()) return;
        Set<Long> ids = o.getItems().stream().map(OrderItem::getProductId).collect(Collectors.toCollection(TreeSet::new));
        Map<Long, Product> byId = products.lockAllById(ids).stream().collect(Collectors.toMap(Product::getId, p -> p));
        for (OrderItem i : o.getItems()) {
            Product p = byId.get(i.getProductId());
            if (p != null && p.getStock() != null) p.setStock(p.getStock() + i.getQuantity());
        }
    }

    private void publish(Order o) {
        events.publishEvent(new OrderEvent(o.getId(), o.getOrderNumber(), o.getCustomerId(), o.getRestaurantId(),
                o.getDeliveryPartnerId(), o.getStatus()));
    }

    /** Builds the response for a specific viewer; sensitive fields are only included for people who need them. */
    OrderDto toDto(Order o, AuthUser viewer) {
        boolean customerOrAdmin = viewer.role() == Role.CUSTOMER || viewer.role().isAdmin();
        boolean rider = viewer.role() == Role.DELIVERY_PARTNER;
        String restaurantName = o.getRestaurantId() == null ? "QuickMart" :
                restaurants.findById(o.getRestaurantId()).map(Restaurant::getName).orElse(null);

        RiderDto riderDto = null;
        if (o.getDeliveryPartnerId() != null && !rider) {
            User ru = users.findById(o.getDeliveryPartnerId()).orElse(null);
            var dp = delivery.findByUserId(o.getDeliveryPartnerId());
            if (ru != null) riderDto = new RiderDto(ru.getName(), ru.getPhone(), dp.map(p -> p.getLat()).orElse(null), dp.map(p -> p.getLng()).orElse(null));
        }
        String customerName = null;
        if (rider || viewer.role().isAdmin() || viewer.role().isRestaurantStaff()) {
            customerName = users.findById(o.getCustomerId()).map(User::getName).orElse(null);
        }
        var addr = new AddressDto(o.getAddrStreet(), o.getAddrArea(), o.getAddrCity(), o.getAddrPincode(), o.getAddrInstructions(), o.getAddrLat(), o.getAddrLng());
        return new OrderDto(o.getId(), o.getOrderNumber(), o.getStatus(), o.getPaymentStatus(), o.getPaymentMethod(), o.isGrocery(),
                o.getRestaurantId(), restaurantName,
                o.getItems().stream().map(i -> new ItemDto(i.getProductId(), i.getName(), i.getVariantName(), i.getAddons(), i.getUnitPrice(), i.getQuantity(), i.getLineTotal(), i.getNotes())).toList(),
                o.getSubtotal(), o.getPackagingFee(), o.getDeliveryFee(), o.getPlatformFee(), o.getTax(), o.getDiscount(), o.getTip(), o.getTotal(), o.getCouponCode(),
                addr, customerName, (rider || customerOrAdmin) ? o.getCustomerPhone() : null, riderDto,
                customerOrAdmin ? o.getDeliveryOtp() : null, o.getRejectionReason(),
                o.getHistory().stream().map(h -> new HistoryDto(h.getStatus(), h.getActorRole(), h.getNote(), h.getCreatedAt())).toList(),
                o.getCreatedAt(), o.getUpdatedAt());
    }
}
