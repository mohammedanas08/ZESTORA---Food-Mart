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
    private static final List<String> FILES = List.of("seed/curated-restaurants.json");

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
    void onlyTheThreeSuppliedRestaurantsAreSeeded() throws Exception {
        Set<String> slugs = new HashSet<>();
        for (String file : FILES) {
            for (JsonNode r : load(file).get("restaurants")) slugs.add(r.get("slug").asText());
        }
        assertThat(slugs).containsExactlyInAnyOrder("layali-arabia-restaurant", "udupi-deluxe-pure-veg-restaurant", "the-royal-olives-restaurant");
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
    void udupiDeluxeHoldsOnlyWhatWasVerifiedAndTheFullMenuAsSupplied() throws Exception {
        JsonNode udupi = null;
        for (JsonNode r : load("seed/curated-restaurants.json").get("restaurants")) {
            if (r.get("slug").asText().equals("udupi-deluxe-pure-veg-restaurant")) udupi = r;
        }
        assertThat(udupi).as("Udupi Deluxe is present").isNotNull();
        assertThat(udupi.get("name").asText()).isEqualTo("Udupi Deluxe \u2013 Pure Veg Restaurant");
        assertThat(udupi.get("vegOnly").asBoolean()).as("pure veg, so the Pure veg filter includes it").isTrue();
        assertThat(udupi.get("ownerEmail").asText()).isEqualTo("udupi-deluxe-pure-veg-restaurant@zestora.local");
        assertThat(udupi.get("imageUrl").asText()).isEqualTo("/restaurants/udupi-deluxe-storefront.webp");

        // Nothing here may come from the Bengaluru "Udupi Deluxe" or any other look-alike, and nothing may be guessed.
        assertThat(udupi.get("city").asText()).as("town unknown, so not stated").isEmpty();
        for (String unverified : List.of("lat", "lng", "address", "phone", "openingHours", "rating")) {
            assertThat(udupi.has(unverified)).as("no invented " + unverified).isFalse();
        }
        assertThat(udupi.get("deliveryMinutes").get(1).asInt()).as("delivery time unknown").isZero();
        assertThat(JSON.writeValueAsString(udupi)).doesNotContain("560015").doesNotContain("Bengaluru").doesNotContain("96637");

        // The menu as supplied as text: 236 items, 22 categories, every dish vegetarian, no photos borrowed.
        Set<String> categories = new HashSet<>();
        int unpriced = 0, withAddon = 0;
        for (JsonNode m : udupi.get("menu")) {
            categories.add(m.get("category").asText());
            assertThat(m.get("veg").asBoolean()).as("pure veg restaurant: " + m.get("name").asText()).isTrue();
            assertThat(m.hasNonNull("imageUrl")).as("no borrowed photos: " + m.get("name").asText()).isFalse();
            if (m.get("price").isNull()) unpriced++;
            if (m.get("addons").size() > 0) withAddon++;
        }
        assertThat(udupi.get("menu").size()).isEqualTo(236);
        assertThat(categories).hasSize(22).contains("Dosa Varieties", "Chinese Noodles", "Milk Shakes", "Paneer Special", "Fresh Fruit Juice");
        assertThat(unpriced).as("only the conflicting Butter Scotch scoop price is withheld").isEqualTo(1);
        assertThat(item(udupi, "Butter Scotch").get("price").isNull()).isTrue();
        assertThat(withAddon).as("milk shakes that print 'add ice cream Rs 20 extra'").isEqualTo(18);

        // The menu opens with the section exactly as supplied, in the supplied order.
        List<String> expected = List.of("Idly (1)|25", "Idly (2)|35", "Idly (3)|60", "Rava Idly (1)|40", "Vada (1)|40", "Idly (1) Vada (1)|60", "Idly (2) Vada (1)|70");
        for (int k = 0; k < expected.size(); k++) {
            JsonNode m = udupi.get("menu").get(k);
            assertThat(m.get("category").asText()).isEqualTo("South Indian Breakfast");
            assertThat(m.get("name").asText() + "|" + m.get("price").asInt()).isEqualTo(expected.get(k));
        }

        // Spot checks against the supplied menu (names and prices exactly as given).
        assertThat(price(udupi, "Idly (1)")).isEqualByComparingTo("25");
        assertThat(price(udupi, "Masala Dosa")).isEqualByComparingTo("70");
        assertThat(price(udupi, "Paper Masala Dosa")).isEqualByComparingTo("110");
        assertThat(price(udupi, "Paneer Butter Masala")).isEqualByComparingTo("190");
        assertThat(price(udupi, "Mushroom Fried Rice")).isEqualByComparingTo("195");
        assertThat(price(udupi, "Veg Sizzler")).isEqualByComparingTo("270");
        assertThat(price(udupi, "Gobi Manchurian")).isEqualByComparingTo("120");
        assertThat(price(udupi, "Kaju Palak Paneer")).isEqualByComparingTo("220");
        assertThat(price(udupi, "Dalam")).isEqualByComparingTo("120");
        assertThat(price(udupi, "Mineral Water")).isEqualByComparingTo("20");
        assertThat(price(udupi, "Titanic Spl.")).isEqualByComparingTo("190");
        assertThat(item(udupi, "Fresh Mango Milkshake").get("addons").get(0).get("price").decimalValue()).isEqualByComparingTo("20");
        assertThat(item(udupi, "Paneer Satay").get("description").asText()).isEqualTo("With peanut sauce");
    }

    private static JsonNode item(JsonNode restaurant, String name) {
        for (JsonNode m : restaurant.get("menu")) {
            if (m.get("name").asText().equals(name)) return m;
        }
        throw new AssertionError("no item " + name);
    }

    @Test
    void theRoyalOlivesMenuIsExactlyAsSuppliedAndNothingElseIsInvented() throws Exception {
        JsonNode royal = null;
        for (JsonNode r : load("seed/curated-restaurants.json").get("restaurants")) {
            if (r.get("slug").asText().equals("the-royal-olives-restaurant")) royal = r;
        }
        assertThat(royal).as("The Royal Olives Restaurant is present").isNotNull();
        assertThat(royal.get("name").asText()).isEqualTo("The Royal Olives Restaurant");
        assertThat(royal.get("ownerEmail").asText()).isEqualTo("the-royal-olives-restaurant@zestora.local");
        assertThat(royal.get("vegOnly").asBoolean()).as("serves non-veg, so it is not a pure veg restaurant").isFalse();
        // The town comes only from the menu's own wording ("Bhatkal Special"); nothing else about the location is known.
        assertThat(royal.get("city").asText()).isEqualTo("Bhatkal");
        for (String unverified : List.of("lat", "lng", "address", "phone", "openingHours", "rating")) {
            assertThat(royal.has(unverified)).as("no invented " + unverified).isFalse();
        }
        assertThat(royal.get("deliveryMinutes").get(1).asInt()).as("delivery time unknown").isZero();

        Set<String> categories = new HashSet<>();
        int veg = 0, nonVeg = 0, unknownVeg = 0, unpriced = 0, withDescription = 0;
        for (JsonNode m : royal.get("menu")) {
            String cat = m.get("category").asText();
            categories.add(cat);
            if (m.get("veg").isNull()) unknownVeg++; else if (m.get("veg").asBoolean()) veg++; else nonVeg++;
            if (m.get("price").isNull()) unpriced++;
            if (m.hasNonNull("description")) withDescription++;
            assertThat(m.hasNonNull("imageUrl")).as("no borrowed food photos: " + m.get("name").asText()).isFalse();
            if (cat.startsWith("Non Veg")) assertThat(m.get("veg").asBoolean()).as("non-veg section: " + m.get("name").asText()).isFalse();
            if (cat.startsWith("Veg ")) assertThat(m.get("veg").asBoolean()).as("veg section: " + m.get("name").asText()).isTrue();
        }
        assertThat(royal.get("menu").size()).isEqualTo(193);
        assertThat(categories).hasSize(25).contains("Tandoori Starters", "South Indian Starters", "Chinese Starters", "Veg Main Course",
                "Non Veg Main Course", "Breads", "Rice", "Biryani", "Ice Creams", "Fresh Juices", "Smoothies", "Milkshakes", "Mocktails", "Mojitos");
        assertThat(veg).as("items the menu labels Vegetarian").isEqualTo(105);
        assertThat(nonVeg).as("unlabelled items (all chicken, mutton, prawns, squid or crab)").isEqualTo(88);
        assertThat(unknownVeg).isZero();
        assertThat(unpriced).as("every item has a printed price").isZero();
        assertThat(withDescription).as("13 written descriptions + 12 '[Non Alcoholic]' notes").isEqualTo(25);

        // Prices exactly as printed (the examples from the brief plus a spread across every section).
        assertThat(price(royal, "Green Salad")).isEqualByComparingTo("130");
        assertThat(price(royal, "Al Faham Chicken")).isEqualByComparingTo("324");
        assertThat(price(royal, "Prawns Masala Fry")).isEqualByComparingTo("519");
        assertThat(price(royal, "Tandoori Chicken")).isEqualByComparingTo("324");
        assertThat(price(royal, "Paneer Chilli Dry")).isEqualByComparingTo("312");
        assertThat(price(royal, "Butter Chicken")).isEqualByComparingTo("389");
        assertThat(price(royal, "Plain Naan")).isEqualByComparingTo("46");
        assertThat(price(royal, "Chicken Dum Biryani")).isEqualByComparingTo("312");
        assertThat(price(royal, "Mutton Dum Biryani")).isEqualByComparingTo("364");
        assertThat(price(royal, "French Fries")).isEqualByComparingTo("130");
        assertThat(price(royal, "Vanilla Ice Cream")).isEqualByComparingTo("98");
        assertThat(price(royal, "Watermelon Juice")).isEqualByComparingTo("130");
        assertThat(price(royal, "Blueberry Smoothie")).isEqualByComparingTo("182");
        assertThat(price(royal, "Nutella Milkshake")).isEqualByComparingTo("182");
        assertThat(price(royal, "Kiwi Delight Mocktail")).isEqualByComparingTo("143");
        assertThat(price(royal, "Virgin Mojito")).isEqualByComparingTo("143");
        assertThat(price(royal, "Mutton Barra Kabab")).isEqualByComparingTo("909");
        assertThat(price(royal, "Ginger Fizz Mocktail")).isEqualByComparingTo("59");
        assertThat(price(royal, "Ferrero Rocher Milkshake")).isEqualByComparingTo("221");
        assertThat(price(royal, "Squid Pepper Garlic")).isEqualByComparingTo("488");
        assertThat(price(royal, "Tandoori Chicken Salad + Butter Roti")).isEqualByComparingTo("241");

        // Names are kept exactly as supplied, including the spelling slips in the source menu.
        for (String exact : List.of("Chicken Cheese Garlic Kaba", "Dark Chocolate Milskhake", "Blue Berry Blast Mockatil", "Tenders Coconut Milkshake", "Royal Gadbad")) {
            assertThat(item(royal, exact)).as(exact).isNotNull();
        }
        // Descriptions are the supplied text, not generated ones.
        assertThat(item(royal, "Tandoori Chicken").get("description").asText()).startsWith("Our Tandoori Chicken is marinated overnight in yogurt");
        assertThat(item(royal, "Murgh Lababdar").get("description").asText()).contains("Our Bhatkal Special Murgh Lababdar");
        assertThat(item(royal, "Kiwi Delight Mocktail").get("description").asText()).isEqualTo("Non Alcoholic");
        assertThat(item(royal, "Plain Naan").hasNonNull("description")).as("no description is made up").isFalse();
        // Section placement that the source layout implies.
        assertThat(item(royal, "Mutton Mandi").get("category").asText()).isEqualTo("Rice");
        assertThat(item(royal, "Royal Falooda").get("category").asText()).isEqualTo("Ice Creams");
        assertThat(item(royal, "Squid Koliwada").get("veg").asBoolean()).isFalse();
        assertThat(item(royal, "French Fries").get("veg").asBoolean()).isTrue();
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
