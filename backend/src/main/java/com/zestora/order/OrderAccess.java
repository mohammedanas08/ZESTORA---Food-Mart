package com.zestora.order;

import com.zestora.catalog.Restaurant;
import com.zestora.catalog.RestaurantRepository;
import com.zestora.common.ApiException;
import com.zestora.security.AuthUser;
import org.springframework.stereotype.Component;

/** Ownership rules: WHO may see or act on a specific order. Prevents IDOR across customers, restaurants and riders. */
@Component
public class OrderAccess {
    private final RestaurantRepository restaurants;

    public OrderAccess(RestaurantRepository restaurants) {
        this.restaurants = restaurants;
    }

    public boolean canView(AuthUser user, Order o) {
        return switch (user.role()) {
            case ADMIN, SUPER_ADMIN -> true;
            case CUSTOMER -> o.getCustomerId().equals(user.id());
            case RESTAURANT_OWNER, RESTAURANT_MANAGER -> ownsRestaurant(user, o);
            case DELIVERY_PARTNER -> user.id().equals(o.getDeliveryPartnerId());
            default -> false;
        };
    }

    /** Throws 404 (not 403) so outsiders cannot even confirm that an order id exists. */
    public void assertCanView(AuthUser user, Order o) {
        if (!canView(user, o)) throw ApiException.notFound("Order not found");
    }

    private boolean ownsRestaurant(AuthUser user, Order o) {
        if (o.getRestaurantId() == null) return false;
        return restaurants.findByOwnerId(user.id()).map(Restaurant::getId).filter(id -> id.equals(o.getRestaurantId())).isPresent();
    }
}
