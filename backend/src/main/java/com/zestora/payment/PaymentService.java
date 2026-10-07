package com.zestora.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zestora.common.ApiException;
import com.zestora.common.AuditService;
import com.zestora.config.AppProperties;
import com.zestora.order.Order;
import com.zestora.order.OrderRepository;
import com.zestora.order.OrderService;
import com.zestora.order.OrderStatus;
import com.zestora.security.AuthUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    public record CheckoutDto(Long orderId, String orderNumber, String provider, String providerOrderId, long amountPaise,
                              String currency, String keyId, boolean mock) {}

    private final PaymentGateway gateway;
    private final PaymentRepository payments;
    private final OrderRepository orders;
    private final OrderService orderService;
    private final AuditService audit;
    private final AppProperties props;
    private final ObjectMapper mapper;

    public PaymentService(PaymentGateway gateway, PaymentRepository payments, OrderRepository orders,
                          OrderService orderService, AuditService audit, AppProperties props, ObjectMapper mapper) {
        this.gateway = gateway;
        this.payments = payments;
        this.orders = orders;
        this.orderService = orderService;
        this.audit = audit;
        this.props = props;
        this.mapper = mapper;
    }

    /** Starts (or resumes) checkout. The amount ALWAYS comes from the stored order total, never from the client. */
    @Transactional
    public CheckoutDto createCheckout(AuthUser user, Long orderId) {
        Order o = ownedOrder(user, orderId);
        if (o.getStatus() != OrderStatus.PLACED || o.getPaymentStatus() != Order.PaymentStatus.PENDING) {
            throw ApiException.conflict("This order is not awaiting payment");
        }
        var existing = payments.findFirstByOrderIdAndStatusOrderByIdDesc(o.getId(), Payment.Status.CREATED);
        if (existing.isPresent() && existing.get().getAmount().compareTo(o.getTotal()) == 0) {
            Payment p = existing.get();
            return new CheckoutDto(o.getId(), o.getOrderNumber(), p.getProvider(), p.getProviderOrderId(),
                    p.getAmount().movePointRight(2).longValueExact(), "INR", publicKey(), "MOCK".equals(p.getProvider()));
        }
        var po = gateway.createOrder(o.getOrderNumber(), o.getTotal());
        Payment p = new Payment();
        p.setOrderId(o.getId());
        p.setProvider(gateway.provider());
        p.setProviderOrderId(po.providerOrderId());
        p.setAmount(o.getTotal());
        payments.save(p);
        return new CheckoutDto(o.getId(), o.getOrderNumber(), p.getProvider(), po.providerOrderId(), po.amountPaise(),
                po.currency(), po.publicKey(), po.mock());
    }

    /** Browser callback after checkout. Only a valid HMAC signature can mark an order as paid. */
    @Transactional
    public void verifyCheckout(AuthUser user, Long orderId, String providerOrderId, String providerPaymentId, String signature) {
        Order o = ownedOrder(user, orderId);
        Payment p = payments.findByProviderOrderId(providerOrderId).filter(x -> x.getOrderId().equals(o.getId()))
                .orElseThrow(() -> ApiException.badRequest("Unknown payment for this order"));
        if (!gateway.verifyPaymentSignature(providerOrderId, providerPaymentId, signature)) {
            p.setStatus(Payment.Status.FAILED);
            audit.record(user, "PAYMENT_SIGNATURE_INVALID", "Order", o.getId(), providerOrderId);
            throw ApiException.badRequest("Payment verification failed");
        }
        settle(p, providerPaymentId);
    }

    /** Provider webhook: authenticated by signature, idempotent by event id. */
    @Transactional
    public void handleWebhook(String rawBody, String signature, String eventId) {
        if (!gateway.verifyWebhookSignature(rawBody, signature)) throw ApiException.unauthorized("Invalid webhook signature");
        if (eventId != null && payments.recordEvent(eventId) == 0) return;           // already processed
        try {
            JsonNode root = mapper.readTree(rawBody);
            String event = root.path("event").asText();
            if (!event.equals("payment.captured") && !event.equals("order.paid")) return;
            JsonNode pay = root.path("payload").path("payment").path("entity");
            String providerOrderId = pay.path("order_id").asText(null);
            String providerPaymentId = pay.path("id").asText(null);
            long amountPaise = pay.path("amount").asLong(-1);
            if (providerOrderId == null) return;
            Payment p = payments.findByProviderOrderId(providerOrderId).orElse(null);
            if (p == null) { log.warn("Webhook for unknown provider order {}", providerOrderId); return; }
            if (p.getAmount().movePointRight(2).longValue() != amountPaise) {
                audit.record(null, "PAYMENT_AMOUNT_MISMATCH", "Order", p.getOrderId(), providerOrderId);
                return;                                                                  // never trust a mismatched amount
            }
            settle(p, providerPaymentId);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Could not process webhook", e);
            throw ApiException.badRequest("Malformed webhook");
        }
    }

    /** Dev-only: completes payment without a provider. Disabled unless zestora.dev.allow-payment-simulation=true. */
    @Transactional
    public void simulate(AuthUser user, Long orderId) {
        if (!props.dev().allowPaymentSimulation()) throw ApiException.notFound("Not found");
        Order o = ownedOrder(user, orderId);
        Payment p = payments.findFirstByOrderIdAndStatusOrderByIdDesc(o.getId(), Payment.Status.CREATED)
                .orElseThrow(() -> ApiException.conflict("Start checkout first"));
        settle(p, "pay_sim_" + System.currentTimeMillis());
    }

    private void settle(Payment p, String providerPaymentId) {
        if (p.getStatus() == Payment.Status.PAID) return;                              // idempotent
        p.setStatus(Payment.Status.PAID);
        p.setProviderPaymentId(providerPaymentId);
        p.setUpdatedAt(java.time.Instant.now());
        orderService.markPaid(p.getOrderId());
    }

    private Order ownedOrder(AuthUser user, Long orderId) {
        Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (!o.getCustomerId().equals(user.id())) throw ApiException.notFound("Order not found");
        return o;
    }

    private String publicKey() {
        String k = props.razorpay().keyId();
        return k == null ? "" : k;
    }
}
