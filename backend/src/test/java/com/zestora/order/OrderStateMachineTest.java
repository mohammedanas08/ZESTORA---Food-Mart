package com.zestora.order;

import com.zestora.common.ApiException;
import com.zestora.user.Role;
import org.junit.jupiter.api.Test;

import static com.zestora.order.OrderStatus.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderStateMachineTest {

    @Test
    void happyPathIsLegal() {
        OrderStatus[] path = {PLACED, CONFIRMED, RESTAURANT_ACCEPTED, PREPARING, READY_FOR_PICKUP, DELIVERY_ASSIGNED, PICKED_UP, ON_THE_WAY, DELIVERED};
        for (int i = 0; i < path.length - 1; i++) {
            assertThat(OrderStateMachine.isLegal(path[i], path[i + 1])).as(path[i] + "→" + path[i + 1]).isTrue();
        }
    }

    @Test
    void stagesCannotBeSkipped() {
        assertThat(OrderStateMachine.isLegal(PLACED, DELIVERED)).isFalse();
        assertThat(OrderStateMachine.isLegal(CONFIRMED, PREPARING)).isFalse();
        assertThat(OrderStateMachine.isLegal(READY_FOR_PICKUP, PICKED_UP)).isFalse();
    }

    @Test
    void terminalStatesAreFinalAndCannotBeCancelledAfterPickup() {
        for (OrderStatus s : OrderStatus.values()) {
            assertThat(OrderStateMachine.isLegal(DELIVERED, s)).isFalse();
            assertThat(OrderStateMachine.isLegal(CANCELLED, s)).isFalse();
        }
        assertThat(OrderStateMachine.isLegal(PICKED_UP, CANCELLED)).isFalse();
        assertThat(OrderStateMachine.isLegal(ON_THE_WAY, CANCELLED)).isFalse();
    }

    @Test
    void customerMayOnlyCancelBeforePreparing() {
        OrderStateMachine.assertAllowed(Role.CUSTOMER, CONFIRMED, CANCELLED, false);
        assertThatThrownBy(() -> OrderStateMachine.assertAllowed(Role.CUSTOMER, PREPARING, CANCELLED, false))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> OrderStateMachine.assertAllowed(Role.CUSTOMER, CONFIRMED, RESTAURANT_ACCEPTED, false))
                .isInstanceOf(ApiException.class).hasMessageContaining("cannot set");
    }

    @Test
    void rolesAreLimitedToTheirOwnSteps() {
        // restaurant cannot mark delivered, rider cannot accept an order
        assertThatThrownBy(() -> OrderStateMachine.assertAllowed(Role.RESTAURANT_OWNER, ON_THE_WAY, DELIVERED, false)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> OrderStateMachine.assertAllowed(Role.DELIVERY_PARTNER, CONFIRMED, RESTAURANT_ACCEPTED, false)).isInstanceOf(ApiException.class);
        OrderStateMachine.assertAllowed(Role.RESTAURANT_OWNER, CONFIRMED, RESTAURANT_ACCEPTED, false);
        OrderStateMachine.assertAllowed(Role.DELIVERY_PARTNER, DELIVERY_ASSIGNED, PICKED_UP, false);
    }

    @Test
    void customerCannotConfirmPaymentThemselves() {
        // PLACED→CONFIRMED is system-only
        assertThatThrownBy(() -> OrderStateMachine.assertAllowed(Role.CUSTOMER, PLACED, CONFIRMED, false)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> OrderStateMachine.assertAllowed(Role.RESTAURANT_OWNER, PLACED, CONFIRMED, false)).isInstanceOf(ApiException.class);
        OrderStateMachine.assertAllowed(Role.ADMIN, PLACED, CONFIRMED, true);
    }
}
