package com.zestora.seed;

import com.zestora.catalog.*;
import com.zestora.config.AppProperties;
import com.zestora.delivery.DeliveryPartner;
import com.zestora.delivery.DeliveryPartnerRepository;
import com.zestora.promotion.Coupon;
import com.zestora.promotion.CouponRepository;
import com.zestora.user.Role;
import com.zestora.user.User;
import com.zestora.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Demo data for local development ONLY (zestora.dev.seed-demo-data=true, enabled by the "dev" profile).
 * It never runs in production, and it only seeds an empty database.
 * Every demo account uses the password from the DEMO_PASSWORD environment variable (backend/.env).
 */
@Component
@Order(1)
public class DevDataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    private static final String IMG = "https://images.unsplash.com/";

    private final AppProperties props;
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final ProductRepository products;
    private final CouponRepository coupons;
    private final DeliveryPartnerRepository riders;
    private final PasswordEncoder encoder;

    public DevDataSeeder(AppProperties props, UserRepository users, RestaurantRepository restaurants, ProductRepository products,
                         CouponRepository coupons, DeliveryPartnerRepository riders, PasswordEncoder encoder) {
        this.props = props;
        this.users = users;
        this.restaurants = restaurants;
        this.products = products;
        this.coupons = coupons;
        this.riders = riders;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!props.dev().seedDemoData() || users.count() > 0) return;
        String demoPassword = DemoPasswords.require(props);
        log.warn("Seeding DEMO data (dev profile). Do not use this profile in production.");

        user("Anas Ahmed", "customer@zestora.com", "+91 98765 43210", demoPassword, Role.CUSTOMER);
        user("Zestora Admin", "admin@zestora.com", "+91 90000 00001", demoPassword, Role.SUPER_ADMIN);
        User owner = user("Tariq - Spice Garden", "spicegarden@zestora.local", "+91 98800 11223", demoPassword, Role.RESTAURANT_OWNER);
        User rider = user("Rahul Naik", "rahul.rider@zestora.local", "+91 94488 55667", demoPassword, Role.DELIVERY_PARTNER);

        DeliveryPartner dp = new DeliveryPartner();
        dp.setUserId(rider.getId());
        dp.setVehicleType("Honda Activa 6G");
        dp.setVehicleNumber("KA-47-E-8821");
        dp.setOnline(true);
        riders.save(dp);

        Restaurant spice = restaurant(owner.getId(), "Spice Garden", "North Indian, Biryani, Tandoor, Mughlai", "4.60", 25, 35, 149, 400, false,
                "Authentic North Indian curries, aromatic biryanis and tandoor breads");
        Restaurant coastal = restaurant(null, "Coastal Bites", "Coastal Seafood, Mangalorean", "4.80", 20, 30, 199, 500, false, "Fresh catch, Mangalorean style");
        Restaurant biryani = restaurant(null, "Biryani House", "Biryani, Bhatkali", "4.90", 20, 30, 149, 350, false, "Authentic dum biryani");
        restaurant(null, "Pizza Street", "Pizza, Italian", "4.70", 25, 35, 199, 450, false, "Artisan wood-fired pizza");
        restaurant(null, "Burger Hub", "Burgers, American", "4.50", 15, 25, 99, 300, false, "Smash burgers");
        restaurant(null, "Cafe Aroma", "Desserts, Beverages, Bakery", "4.60", 15, 25, 99, 250, true, "Desserts, beverages and bakery");

        Product dum = food(spice, "Special Chicken Biryani", "Biryani", "320", false, "Slow-cooked dum biryani with raita");
        variant(dum, "Regular", "320");
        variant(dum, "Jumbo Pack", "420");
        addon(dum, "Extra Egg", "25");
        addon(dum, "Extra Raita", "20");
        food(spice, "Butter Chicken", "Main Course", "290", false, "Creamy tomato gravy");
        food(spice, "Paneer Tikka", "Starters", "240", true, "Char-grilled cottage cheese");
        food(spice, "Garlic Naan", "Breads", "60", true, "Tandoor-baked");
        food(coastal, "Fish Curry Meals", "Meals", "260", false, "Mangalorean fish curry with rice");
        food(coastal, "Prawn Ghee Roast", "Starters", "340", false, "Spicy ghee roast");
        food(biryani, "Bhatkali Mutton Biryani", "Biryani", "380", false, "Traditional Bhatkali style");

        grocery("Fresh Milk 1L", "Dairy", "62", 40);
        grocery("Brown Eggs (6)", "Dairy", "58", 30);
        grocery("Basmati Rice 1kg", "Staples", "110", 25);
        grocery("Toor Dal 500g", "Staples", "85", 25);
        grocery("Tomatoes 500g", "Vegetables", "30", 50);
        grocery("Onions 1kg", "Vegetables", "45", 50);
        grocery("Bananas (dozen)", "Fruits", "60", 35);
        grocery("Bread Loaf", "Bakery", "40", 20);

        coupon("ZEST50", "50% off up to ₹100", Coupon.Type.PERCENT, "50", "100", "299");
        coupon("FREEDEL", "Free delivery", Coupon.Type.FREE_DELIVERY, "0", null, "199");
        coupon("WELCOME100", "₹100 off on first big order", Coupon.Type.FLAT, "100", null, "399");
    }

    private User user(String name, String email, String phone, String password, Role role) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPhone(phone);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(role);
        return users.save(u);
    }

    private Restaurant restaurant(Long ownerId, String name, String cuisines, String rating, int min, int max, int minOrder,
                                  int costForTwo, boolean vegOnly, String description) {
        Restaurant r = new Restaurant();
        r.setOwnerId(ownerId);
        r.setName(name);
        r.setSlug(name.toLowerCase().replace(' ', '-'));
        r.setCuisines(cuisines);
        r.setDescription(description);
        r.setRating(new BigDecimal(rating));
        r.setReviewCount(120);
        r.setDeliveryMin(min);
        r.setDeliveryMax(max);
        r.setMinOrder(BigDecimal.valueOf(minOrder));
        r.setCostForTwo(BigDecimal.valueOf(costForTwo));
        r.setVegOnly(vegOnly);
        r.setImageUrl(IMG + "photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80");
        return restaurants.save(r);
    }

    private Product food(Restaurant r, String name, String category, String price, boolean veg, String desc) {
        Product p = new Product();
        p.setRestaurantId(r.getId());
        p.setName(name);
        p.setCategory(category);
        p.setPrice(new BigDecimal(price));
        p.setVeg(veg);
        p.setDescription(desc);
        return products.save(p);
    }

    private void variant(Product p, String name, String price) {
        p.getVariants().add(new ProductVariant(p, name, new BigDecimal(price)));
    }

    private void addon(Product p, String name, String price) {
        p.getAddons().add(new ProductAddon(p, name, new BigDecimal(price)));
    }

    private void grocery(String name, String category, String price, int stock) {
        Product p = new Product();
        p.setName(name);
        p.setCategory(category);
        p.setPrice(new BigDecimal(price));
        p.setGrocery(true);
        p.setStock(stock);
        p.setPrepMinutes(5);
        products.save(p);
    }

    private void coupon(String code, String desc, Coupon.Type type, String value, String max, String min) {
        coupons.save(new Coupon(code, desc, type, new BigDecimal(value), max == null ? null : new BigDecimal(max), new BigDecimal(min)));
    }
}
