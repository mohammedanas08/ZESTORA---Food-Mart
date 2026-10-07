package com.zestora.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zestora.catalog.*;
import com.zestora.config.AppProperties;
import com.zestora.user.Role;
import com.zestora.user.User;
import com.zestora.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Loads the hand-entered restaurants in {@code seed/curated-restaurants.json} (dev profile "bhatkal" only): Layali Arabia Restaurant and
 * Udupi Deluxe, each with the menu supplied for it. Fields that could not be verified are simply absent (null price = "ask the restaurant",
 * null veg = unknown).
 * <p>Idempotent: an owner email that already exists is skipped (and a restaurant with an empty menu gets its menu filled in).
 * Every owner logs in with DEMO_PASSWORD from backend/.env.
 */
@Component
@Order(2)
public class BhatkalDemoSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(BhatkalDemoSeeder.class);
    private static final List<String> FILES = List.of("seed/curated-restaurants.json");

    private final AppProperties props;
    private final ObjectMapper json;
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final ProductRepository products;
    private final PasswordEncoder encoder;

    public BhatkalDemoSeeder(AppProperties props, ObjectMapper json, UserRepository users, RestaurantRepository restaurants,
                             ProductRepository products, PasswordEncoder encoder) {
        this.props = props;
        this.json = json;
        this.users = users;
        this.restaurants = restaurants;
        this.products = products;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!props.dev().seedBhatkal()) return;
        String demoPassword = DemoPasswords.require(props);

        int added = 0;
        int filled = 0;
        for (String file : FILES) {
            JsonNode root;
            try (InputStream in = new ClassPathResource(file).getInputStream()) {
                root = json.readTree(in);
            }
            for (JsonNode r : root.get("restaurants")) {
                if (users.existsByEmailIgnoreCase(r.get("ownerEmail").asText())) {
                    if (fillEmptyMenu(r)) filled++;       // restaurant exists but still has no menu: load it now
                    continue;
                }
                seedRestaurant(r, demoPassword);
                added++;
            }
        }

        log.warn("Bhatkal demo data: {} restaurant(s) added, {} menu(s) filled in (see backend/DEMO_ACCOUNTS.md for logins)", added, filled);
    }

    private void seedRestaurant(JsonNode r, String demoPassword) {
        User owner = new User();
        owner.setName(r.get("ownerName").asText());
        owner.setEmail(r.get("ownerEmail").asText());
        owner.setPasswordHash(encoder.encode(demoPassword));
        owner.setRole(Role.RESTAURANT_OWNER);
        users.save(owner);

        Restaurant rest = new Restaurant();
        rest.setOwnerId(owner.getId());
        rest.setName(r.get("name").asText());
        rest.setSlug(r.get("slug").asText());
        rest.setDescription(text(r, "description"));
        rest.setCuisines(String.join(", ", strings(r.get("cuisines"))));
        rest.setCity(r.get("city").asText());
        rest.setImageUrl(text(r, "imageUrl"));
        if (r.hasNonNull("lat")) rest.setLat(r.get("lat").asDouble());
        if (r.hasNonNull("lng")) rest.setLng(r.get("lng").asDouble());
        rest.setVegOnly(r.path("vegOnly").asBoolean(false));
        rest.setMinOrder(BigDecimal.valueOf(r.path("minOrder").asDouble(99)));
        if (r.has("deliveryMinutes")) {                      // unknown delivery time is stored as 0 and hidden in the UI
            rest.setDeliveryMin(r.get("deliveryMinutes").get(0).asInt());
            rest.setDeliveryMax(r.get("deliveryMinutes").get(1).asInt());
        }
        // Rating, review count and cost-for-two stay at "unknown": there is no real data for them.
        restaurants.save(rest);
        addMenu(rest, r.get("menu"));
    }

    /**
     * A restaurant that was seeded earlier without a menu (nothing verified at the time) gets its menu and details once the data file has them.
     * A restaurant that already has dishes is never touched, so edits made by its owner are safe.
     */
    private boolean fillEmptyMenu(JsonNode r) {
        if (r.get("menu").isEmpty()) return false;
        return restaurants.findBySlug(r.get("slug").asText()).filter(rest -> products.countByRestaurantId(rest.getId()) == 0).map(rest -> {
            rest.setDescription(text(r, "description"));
            rest.setCuisines(String.join(", ", strings(r.get("cuisines"))));
            addMenu(rest, r.get("menu"));
            return true;
        }).orElse(false);
    }

    private void addMenu(Restaurant rest, JsonNode menu) {
        for (JsonNode m : menu) {
            Product p = new Product();
            p.setRestaurantId(rest.getId());
            p.setName(m.get("name").asText());
            p.setCategory(m.get("category").asText());
            if (m.hasNonNull("price")) p.setPrice(BigDecimal.valueOf(m.get("price").asDouble()));
            if (m.hasNonNull("veg")) p.setVeg(m.get("veg").asBoolean());
            p.setDescription(text(m, "description"));
            p.setImageUrl(text(m, "imageUrl"));
            for (JsonNode v : m.path("variants")) p.getVariants().add(new ProductVariant(p, v.get("name").asText(), BigDecimal.valueOf(v.get("price").asDouble())));
            for (JsonNode a : m.path("addons")) p.getAddons().add(new ProductAddon(p, a.get("name").asText(), BigDecimal.valueOf(a.get("price").asDouble())));
            products.save(p);
        }
    }

    private static String text(JsonNode n, String field) {
        return n.hasNonNull(field) ? n.get(field).asText() : null;
    }

    private static List<String> strings(JsonNode arr) {
        List<String> out = new ArrayList<>();
        arr.forEach(x -> out.add(x.asText()));
        return out;
    }
}
