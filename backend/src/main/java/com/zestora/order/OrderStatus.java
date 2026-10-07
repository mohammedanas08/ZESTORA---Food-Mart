package com.zestora.order;

public enum OrderStatus {
    PLACED,               // created, awaiting payment
    CONFIRMED,            // payment verified
    RESTAURANT_ACCEPTED,
    PREPARING,
    READY_FOR_PICKUP,
    DELIVERY_ASSIGNED,
    PICKED_UP,
    ON_THE_WAY,
    DELIVERED,
    CANCELLED
}
