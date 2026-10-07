package com.zestora.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OrderScheduler {
    private static final Logger log = LoggerFactory.getLogger(OrderScheduler.class);
    private final OrderService orders;

    public OrderScheduler(OrderService orders) {
        this.orders = orders;
    }

    /** Retry rider assignment for orders that became ready while nobody was free. */
    @Scheduled(fixedDelay = 15_000, initialDelay = 30_000)
    public void dispatch() {
        try {
            int n = orders.dispatchPending();
            if (n > 0) log.info("Dispatched {} waiting order(s)", n);
        } catch (Exception e) {
            log.warn("Dispatch run failed", e);
        }
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    public void expire() {
        try {
            int n = orders.expireUnpaid();
            if (n > 0) log.info("Cancelled {} unpaid order(s)", n);
        } catch (Exception e) {
            log.warn("Unpaid-order expiry failed", e);
        }
    }
}
