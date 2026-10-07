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
import java.util.List;

/**
 * Loads real restaurant PLACES around Bhatkal (from OpenStreetMap, see scripts/generate_bhatkal_seed.py) together with
 * SAMPLE menus and a demo owner login for each (password: DEMO_PASSWORD from backend/.env). Dev only (profile "bhatkal"); idempotent: an owner email that already
 * exists is skipped, so restarting never duplicates data.
 */
@Component
@Order(2)
public class BhatkalDemoSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(BhatkalDemoSeeder.class);
    private static final List<String> SAMPLE_SLUGS =
            List.of("spice-garden", "coastal-bites", "biryani-house", "pizza-street", "burger-hub", "cafe-aroma");

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

        JsonNode root;
        try (InputStream in = new ClassPathResource("seed/bhatkal-restaurants.json").getInputStream()) {
            root = json.readTree(in);
        }

        int added = 0;
        for (JsonNode r : root.get("restaurants")) {
            String email = r.get("ownerEmail").asText();
            if (users.existsByEmailIgnoreCase(email)) continue;

            User owner = new User();
            owner.setName(r.get("ownerName").asText());
            owner.setEmail(email);
            owner.setPasswordHash(encoder.encode(demoPassword));
            owner.setRole(Role.RESTAURANT_OWNER);
            users.save(owner);

            Restaurant rest = new Restaurant();
            rest.setOwnerId(owner.getId());
            rest.setName(r.get("name").asText());
            rest.setSlug(r.get("slug").asText());
            rest.setDescription(r.get("description").asText());
            rest.setCuisines(String.join(", ", strings(r.get("cuisines"))));
            rest.setCity(r.get("city").asText());
            rest.setLat(r.get("lat").asDouble());
            rest.setLng(r.get("lng").asDouble());
            rest.setVegOnly(r.get("vegOnly").asBoolean());
            rest.setMinOrder(BigDecimal.valueOf(99));
            // Rating, review count and cost-for-two are left at "unknown" on purpose: there is no real data for them.
            restaurants.save(rest);

            for (JsonNode m : r.get("menu")) {
                Product p = new Product();
                p.setRestaurantId(rest.getId());
                p.setName(m.get("name").asText());
                p.setCategory(m.get("category").asText());
                p.setPrice(BigDecimal.valueOf(m.get("price").asDouble()));
                p.setVeg(m.get("veg").asBoolean());
                if (!m.get("description").isNull()) p.setDescription(m.get("description").asText());
                for (JsonNode v : m.get("variants")) p.getVariants().add(new ProductVariant(p, v.get("name").asText(), BigDecimal.valueOf(v.get("price").asDouble())));
                for (JsonNode a : m.get("addons")) p.getAddons().add(new ProductAddon(p, a.get("name").asText(), BigDecimal.valueOf(a.get("price").asDouble())));
                products.save(p);
            }
            added++;
        }

        if (props.dev().hideSampleRestaurants()) {
            for (String slug : SAMPLE_SLUGS) {
                restaurants.findAll().stream().filter(x -> slug.equals(x.getSlug())).forEach(x -> x.setActive(false));
            }
        }
        log.warn("Bhatkal demo data: {} restaurant(s) added (sample menus, see backend/DEMO_ACCOUNTS.md for logins)", added);
    }

    private static List<String> strings(JsonNode arr) {
        List<String> out = new java.util.ArrayList<>();
        arr.forEach(n -> out.add(n.asText()));
        return out;
    }
}
