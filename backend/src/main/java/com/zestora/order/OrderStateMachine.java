package com.zestora.order;

import com.zestora.common.ApiException;
import com.zestora.user.Role;
import org.springframework.http.HttpStatus;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static com.zestora.order.OrderStatus.*;

/**
 * The only place that knows which status changes are legal and WHO may make them.
 *
 *   PLACED → CONFIRMED → RESTAURANT_ACCEPTED → PREPARING → READY_FOR_PICKUP → DELIVERY_ASSIGNED
 *          → PICKED_UP → ON_THE_WAY → DELIVERED          (CANCELLED reachable only before pickup)
 */
public final class OrderStateMachine {
    private OrderStateMachine() {}

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        TRANSITIONS.put(PLACED, EnumSet.of(CONFIRMED, CANCELLED));
        TRANSITIONS.put(CONFIRMED, EnumSet.of(RESTAURANT_ACCEPTED, CANCELLED));
        TRANSITIONS.put(RESTAURANT_ACCEPTED, EnumSet.of(PREPARING, CANCELLED));
        TRANSITIONS.put(PREPARING, EnumSet.of(READY_FOR_PICKUP, CANCELLED));
        TRANSITIONS.put(READY_FOR_PICKUP, EnumSet.of(DELIVERY_ASSIGNED, CANCELLED));
        TRANSITIONS.put(DELIVERY_ASSIGNED, EnumSet.of(PICKED_UP, CANCELLED));
        TRANSITIONS.put(PICKED_UP, EnumSet.of(ON_THE_WAY));
        TRANSITIONS.put(ON_THE_WAY, EnumSet.of(DELIVERED));
        TRANSITIONS.put(DELIVERED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(CANCELLED, EnumSet.noneOf(OrderStatus.class));
    }

    /** Statuses each role may set. PLACED→CONFIRMED is done by the payment flow (system), not by a user. */
    private static final Map<Role, Set<OrderStatus>> ACTOR_TARGETS = new EnumMap<>(Role.class);

    static {
        ACTOR_TARGETS.put(Role.CUSTOMER, EnumSet.of(CANCELLED));
        Set<OrderStatus> kitchen = EnumSet.of(RESTAURANT_ACCEPTED, PREPARING, READY_FOR_PICKUP, CANCELLED);
        ACTOR_TARGETS.put(Role.RESTAURANT_OWNER, kitchen);
        ACTOR_TARGETS.put(Role.RESTAURANT_MANAGER, kitchen);
        ACTOR_TARGETS.put(Role.DELIVERY_PARTNER, EnumSet.of(PICKED_UP, ON_THE_WAY, DELIVERED));
        ACTOR_TARGETS.put(Role.ADMIN, EnumSet.allOf(OrderStatus.class));
        ACTOR_TARGETS.put(Role.SUPER_ADMIN, EnumSet.allOf(OrderStatus.class));
    }

    /** A customer may only cancel before the kitchen starts preparing. */
    private static final Set<OrderStatus> CUSTOMER_CANCELLABLE = EnumSet.of(PLACED, CONFIRMED, RESTAURANT_ACCEPTED);

    public static boolean isLegal(OrderStatus from, OrderStatus to) {
        return TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
    }

    /**
     * Role-level check (ownership of the specific order is checked separately in {@link OrderAccess}).
     * @param systemAction true for internal transitions such as payment confirmation or rider dispatch
     */
    public static void assertAllowed(Role role, OrderStatus from, OrderStatus to, boolean systemAction) {
        // 1) Can this role ever set this status? (403 — independent of the order's current state)
        if (!systemAction && !ACTOR_TARGETS.getOrDefault(role, Set.of()).contains(to)) {
            throw ApiException.forbidden("Your role cannot set the order to " + to);
        }
        // 2) Is the move legal from the current state? (409)
        if (!isLegal(from, to)) {
            throw new ApiException(HttpStatus.CONFLICT, "ILLEGAL_TRANSITION", "Cannot change order from " + from + " to " + to);
        }
        // 3) Customers may only cancel early.
        if (!systemAction && role == Role.CUSTOMER && !CUSTOMER_CANCELLABLE.contains(from)) {
            throw new ApiException(HttpStatus.CONFLICT, "ILLEGAL_TRANSITION", "This order can no longer be cancelled");
        }
    }
}
