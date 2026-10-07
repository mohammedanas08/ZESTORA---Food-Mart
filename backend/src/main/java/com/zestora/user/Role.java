package com.zestora.user;

public enum Role {
    CUSTOMER, RESTAURANT_OWNER, RESTAURANT_MANAGER, DELIVERY_PARTNER, GROCERY_MANAGER, SUPPORT_AGENT, ADMIN, SUPER_ADMIN;

    public boolean isAdmin() { return this == ADMIN || this == SUPER_ADMIN; }
    public boolean isRestaurantStaff() { return this == RESTAURANT_OWNER || this == RESTAURANT_MANAGER; }
}
