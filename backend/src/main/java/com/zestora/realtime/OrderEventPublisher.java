package com.zestora.realtime;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/** Pushes order events to WebSocket subscribers, but only AFTER the database transaction has committed. */
@Component
public class OrderEventPublisher {
    private final SimpMessagingTemplate messaging;

    public OrderEventPublisher(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void on(OrderEvent e) {
        Map<String, Object> payload = Map.of("orderId", e.orderId(), "orderNumber", e.orderNumber(), "status", e.status().name());
        messaging.convertAndSend("/topic/order/" + e.orderId(), payload);
        if (e.restaurantId() != null) {
            messaging.convertAndSend("/topic/restaurant/" + e.restaurantId() + "/orders", payload);
        }
        if (e.riderUserId() != null) {
            messaging.convertAndSendToUser(String.valueOf(e.riderUserId()), "/queue/jobs", payload);
        }
        messaging.convertAndSend("/topic/admin/live", payload);
    }
}
