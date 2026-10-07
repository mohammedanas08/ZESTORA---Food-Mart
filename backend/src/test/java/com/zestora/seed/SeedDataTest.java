package com.zestora.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Guards the committed demo data files: well-formed, no duplicates, no free items, no secrets. */
class SeedDataTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final List<String> FILES = List.of("seed/bhatkal-restaurants.json", "seed/curated-restaurants.json");

    private static JsonNode load(String file) throws Exception {
        try (InputStream in = new ClassPathResource(file).getInputStream()) {
            return JSON.readTree(in);
        }
    }

    @Test
    void everyRestaurantAndItemIsWellFormed() throws Exception {
        Set<String> slugs = new HashSet<>();
        Set<String> emails = new HashSet<>();
        for (String file : FILES) {
            for (JsonNode r : load(file).get("restaurants")) {
                String who = file + ": " + r.get("name").asText();
                assertThat(slugs.add(r.get("slug").asText())).as("unique slug, " + who).isTrue();
                assertThat(emails.add(r.get("ownerEmail").asText())).as("unique owner email, " + who).isTrue();
                assertThat(r.get("ownerEmail").asText()).as("owner emails are fake, " + who).endsWith("@zestora.local");
                assertThat(r.get("menu").size()).as("has a menu, " + who).isGreaterThan(0);

                Set<String> names = new HashSet<>();
                for (JsonNode m : r.get("menu")) {
                    String item = who + " / " + m.get("name").asText();
                    assertThat(names.add(m.get("name").asText().toLowerCase())).as("no duplicate item, " + item).isTrue();
                    assertThat(m.get("category").asText()).as("category, " + item).isNotBlank();
                    if (m.hasNonNull("price")) {
                        assertThat(new BigDecimal(m.get("price").asText())).as("price > 0, " + item).isPositive();
                    }
                    if (m.path("variants").size() > 0) {
                        BigDecimal min = null;
                        for (JsonNode v : m.get("variants")) {
                            BigDecimal vp = new BigDecimal(v.get("price").asText());
                            assertThat(vp).as("variant price > 0, " + item).isPositive();
                            min = min == null || vp.compareTo(min) < 0 ? vp : min;
                        }
                        assertThat(new BigDecimal(m.get("price").asText())).as("base price is the cheapest variant, " + item).isEqualByComparingTo(min);
                    }
                    if (m.has("veg") && !m.get("veg").isNull()) assertThat(m.get("veg").isBoolean()).as("veg flag, " + item).isTrue();
                }
            }
        }
    }

    @Test
    void layaliArabiaIsTranscribedFromItsMenuWithoutInventedFacts() throws Exception {
        JsonNode layali = null;
        for (JsonNode r : load("seed/curated-restaurants.json").get("restaurants")) {
            if (r.get("slug").asText().equals("layali-arabia-restaurant")) layali = r;
        }
        assertThat(layali).as("Layali Arabia Restaurant is present").isNotNull();

        // Facts that the menu photos do not contain must not be filled in.
        assertThat(layali.has("lat") || layali.has("lng")).as("no invented coordinates").isFalse();
        assertThat(layali.has("rating") || layali.has("phone") || layali.has("openingHours") || layali.has("address")).as("no invented rating/contact/hours/address").isFalse();
        assertThat(layali.get("deliveryMinutes").get(1).asInt()).as("delivery time unknown (hidden in the UI)").isZero();

        Set<String> categories = new HashSet<>();
        int unpriced = 0;
        for (JsonNode m : layali.get("menu")) {
            categories.add(m.get("category").asText());
            if (m.get("price").isNull()) unpriced++;
            assertThat(m.hasNonNull("imageUrl")).as("no borrowed food photos: " + m.get("name").asText()).isFalse();
        }
        assertThat(layali.get("menu").size()).isEqualTo(102);
        assertThat(categories).hasSize(12).contains("Sea Food", "Soup", "Shawarma", "Fresh Juice", "Mojito", "Mojito Bar", "Broasted");
        assertThat(unpriced).as("the 17 SEASONAL seafood items have no listed price").isEqualTo(17);

        // Spot checks against the printed menu.
        assertThat(price(layali, "Chicken 65")).isEqualByComparingTo("200");
        assertThat(price(layali, "Mutton Ghee Roast")).isEqualByComparingTo("500");
        assertThat(price(layali, "Layali Special")).isEqualByComparingTo("200");
        assertThat(price(layali, "Lime Soda")).isEqualByComparingTo("40");
        assertThat(price(layali, "Cheese Roll Shawarma")).isEqualByComparingTo("140");
    }

    @Test
    void noSecretsInSeedFiles() throws Exception {
        for (String file : FILES) {
            String raw = JSON.writeValueAsString(load(file)).toLowerCase();
            assertThat(raw).as(file).doesNotContain("password").doesNotContain("secret").doesNotContain("token");
        }
    }

    private static BigDecimal price(JsonNode restaurant, String name) {
        for (JsonNode m : restaurant.get("menu")) {
            if (m.get("name").asText().equals(name)) return new BigDecimal(m.get("price").asText());
        }
        throw new AssertionError("no item " + name);
    }
}
