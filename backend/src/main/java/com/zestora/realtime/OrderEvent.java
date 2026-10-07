package com.zestora.realtime;

import com.zestora.order.OrderStatus;

/** Published (inside the order transaction) whenever an order is created or changes status. */
public record OrderEvent(Long orderId, String orderNumber, Long customerId, Long restaurantId, Long riderUserId, OrderStatus status) {}
