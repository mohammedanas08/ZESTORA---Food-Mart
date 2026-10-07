package com.zestora;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end flow against a real PostgreSQL (Testcontainers) with the real Flyway migrations and security rules:
 * customer → payment → restaurant → rider → admin, plus the security properties we promised.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OrderFlowIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void secrets(DynamicPropertyRegistry registry) {
        TestSecrets.register(registry);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private static final String EVE_PASSWORD = TestSecrets.random(12);
    private final Map<String, String> tokens = new HashMap<>();
    private Long orderId;
    private String otp;

    // ───────────── helpers ─────────────

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    private String login(String email, String password) throws Exception {
        if (tokens.containsKey(email)) return tokens.get(email);
        MvcResult r = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")).andExpect(status().isOk()).andReturn();
        String t = body(r).at("/data/accessToken").asText();
        tokens.put(email, t);
        return t;
    }

    private String customer() throws Exception { return login("customer@zestora.com", TestSecrets.DEMO_PASSWORD); }
    private String admin() throws Exception { return login("admin@zestora.com", TestSecrets.DEMO_PASSWORD); }
    private String owner() throws Exception { return login("spicegarden@zestora.local", TestSecrets.DEMO_PASSWORD); }
    private String rider() throws Exception { return login("rahul.rider@zestora.local", TestSecrets.DEMO_PASSWORD); }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder b, String token) {
        return b.header("Authorization", "Bearer " + token);
    }

    private JsonNode getJson(String url, String token, int expected) throws Exception {
        return body(mvc.perform(auth(get(url), token)).andExpect(status().is(expected)).andReturn());
    }

    private JsonNode send(MockHttpServletRequestBuilder b, String token, String content, int expected) throws Exception {
        return body(mvc.perform(auth(b, token).contentType(MediaType.APPLICATION_JSON).content(content)).andExpect(status().is(expected)).andReturn());
    }

    private long productId(String name) throws Exception {
        JsonNode restaurants = body(mvc.perform(get("/api/v1/restaurants")).andReturn()).at("/data");
        for (JsonNode r : restaurants) {
            JsonNode items = body(mvc.perform(get("/api/v1/restaurants/" + r.get("id").asLong())).andReturn()).at("/data/items");
            for (JsonNode i : items) if (i.get("name").asText().equals(name)) return i.get("id").asLong();
        }
        throw new AssertionError("no product " + name);
    }

    private long groceryId(String name) throws Exception {
        for (JsonNode i : body(mvc.perform(get("/api/v1/grocery/products")).andReturn()).at("/data"))
            if (i.get("name").asText().equals(name)) return i.get("id").asLong();
        throw new AssertionError("no grocery " + name);
    }

    private static final String ADDRESS = "\"address\":{\"street\":\"Main Road\",\"area\":\"Central\",\"city\":\"Bhatkal\",\"pincode\":\"581320\"}";

    // ───────────── tests ─────────────

    @Test @Order(1)
    void publicCatalogueIsReadableWithoutLogin() throws Exception {
        assertThat(body(mvc.perform(get("/api/v1/restaurants")).andExpect(status().isOk()).andReturn()).at("/data")).hasSize(6);
        assertThat(body(mvc.perform(get("/api/v1/grocery/products")).andExpect(status().isOk()).andReturn()).at("/data").size()).isGreaterThan(5);
    }

    @Test @Order(2)
    void protectedEndpointsRejectMissingAndForgedTokens() throws Exception {
        mvc.perform(get("/api/v1/orders/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/orders/me").header("Authorization", "Bearer not.a.token")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/metrics")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/payments/1/simulate")).andExpect(status().isUnauthorized());
    }

    @Test @Order(3)
    void registrationCannotEscalateRole() throws Exception {
        JsonNode res = body(mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Eve\",\"email\":\"eve@example.com\",\"password\":\"" + EVE_PASSWORD + "\",\"role\":\"SUPER_ADMIN\"}"))
                .andExpect(status().isOk()).andReturn());
        assertThat(res.at("/data/user/role").asText()).isEqualTo("CUSTOMER");
        assertThat(res.toString()).doesNotContain("passwordHash");
        tokens.put("eve@example.com", res.at("/data/accessToken").asText());
        mvc.perform(get("/api/v1/admin/metrics").header("Authorization", "Bearer " + tokens.get("eve@example.com"))).andExpect(status().isForbidden());
    }

    @Test @Order(4)
    void wrongPasswordIsRejectedWithoutRevealingWhichPartWasWrong() throws Exception {
        JsonNode a = body(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"customer@zestora.com\",\"password\":\"nope-nope\"}")).andExpect(status().isUnauthorized()).andReturn());
        JsonNode b = body(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ghost@zestora.com\",\"password\":\"nope-nope\"}")).andExpect(status().isUnauthorized()).andReturn());
        assertThat(a.at("/error/message").asText()).isEqualTo(b.at("/error/message").asText());
    }

    @Test @Order(5)
    void customerPlacesOrderAndServerComputesPrice() throws Exception {
        long biryani = productId("Special Chicken Biryani");
        JsonNode p = body(mvc.perform(get("/api/v1/products/" + biryani)).andReturn()).at("/data");
        long jumbo = 0, egg = 0;
        for (JsonNode v : p.get("variants")) if (v.get("name").asText().equals("Jumbo Pack")) jumbo = v.get("id").asLong();
        for (JsonNode a : p.get("addons")) if (a.get("name").asText().equals("Extra Egg")) egg = a.get("id").asLong();

        // Client attempts to smuggle prices in: unknown fields must be ignored, totals come from the DB.
        String req = "{\"items\":[{\"productId\":" + biryani + ",\"quantity\":2,\"variantId\":" + jumbo + ",\"addonIds\":[" + egg + "],\"unitPrice\":1}]," + ADDRESS +
                ",\"paymentMethod\":\"UPI\",\"couponCode\":\"zest50\",\"tip\":20,\"total\":1}";
        JsonNode o = send(post("/api/v1/orders"), customer(), req, 200).at("/data");

        // unit = 420 + 25 = 445, x2 = 890; delivery free; packaging 15; platform 5; GST 5% of 905 = 45.25; tip 20; ZEST50 = 100
        assertThat(o.get("subtotal").decimalValue()).isEqualByComparingTo("890");
        assertThat(o.get("discount").decimalValue()).isEqualByComparingTo("100");
        assertThat(o.get("tax").decimalValue()).isEqualByComparingTo("45.25");
        assertThat(o.get("total").decimalValue()).isEqualByComparingTo("875.25");
        assertThat(o.get("status").asText()).isEqualTo("PLACED");
        assertThat(o.get("deliveryOtp").asText()).hasSize(4);
        orderId = o.get("id").asLong();
        otp = o.get("deliveryOtp").asText();
    }

    @Test @Order(6)
    void otherCustomersCannotTouchTheOrderAndKitchenCannotAcceptUnpaid() throws Exception {
        getJson("/api/v1/orders/" + orderId, tokens.get("eve@example.com"), 404);                       // IDOR → not found
        send(patch("/api/v1/orders/" + orderId + "/status"), tokens.get("eve@example.com"), "{\"status\":\"CANCELLED\"}", 404);
        send(patch("/api/v1/orders/" + orderId + "/status"), owner(), "{\"status\":\"RESTAURANT_ACCEPTED\"}", 409); // owner of the restaurant, but order is still unpaid
    }

    @Test @Order(7)
    void paymentUnlocksOrderAndOnlyOwnerCanPay() throws Exception {
        send(post("/api/v1/payments/" + orderId + "/checkout"), tokens.get("eve@example.com"), "{}", 404);
        JsonNode co = send(post("/api/v1/payments/" + orderId + "/checkout"), customer(), "{}", 200).at("/data");
        assertThat(co.get("amountPaise").asLong()).isEqualTo(87525);                                // from DB total, in paise
        // a forged client signature must not pay
        send(post("/api/v1/payments/" + orderId + "/verify"), customer(),
                "{\"razorpayOrderId\":\"" + co.get("providerOrderId").asText() + "\",\"razorpayPaymentId\":\"pay_x\",\"razorpaySignature\":\"deadbeef\"}", 400);
        assertThat(getJson("/api/v1/orders/" + orderId, customer(), 200).at("/data/status").asText()).isEqualTo("PLACED");
        // dev simulator completes it
        send(post("/api/v1/payments/" + orderId + "/simulate"), customer(), "{}", 200);
        JsonNode o = getJson("/api/v1/orders/" + orderId, customer(), 200).at("/data");
        assertThat(o.get("status").asText()).isEqualTo("CONFIRMED");
        assertThat(o.get("paymentStatus").asText()).isEqualTo("PAID");
    }

    @Test @Order(8)
    void rolesCannotOverstepTheirPart() throws Exception {
        send(patch("/api/v1/orders/" + orderId + "/status"), customer(), "{\"status\":\"DELIVERED\"}", 403);
        send(patch("/api/v1/orders/" + orderId + "/status"), customer(), "{\"status\":\"PREPARING\"}", 403);
        send(patch("/api/v1/orders/" + orderId + "/status"), owner(), "{\"status\":\"PREPARING\"}", 409);   // cannot skip ACCEPTED
        send(patch("/api/v1/orders/" + orderId + "/status"), rider(), "{\"status\":\"PICKED_UP\"}", 404);   // rider not assigned
        mvc.perform(get("/api/v1/admin/metrics").header("Authorization", "Bearer " + customer())).andExpect(status().isForbidden());
    }

    @Test @Order(9)
    void kitchenAndRiderCompleteTheDeliveryWithOtp() throws Exception {
        for (String s : new String[]{"RESTAURANT_ACCEPTED", "PREPARING", "READY_FOR_PICKUP"}) {
            send(patch("/api/v1/orders/" + orderId + "/status"), owner(), "{\"status\":\"" + s + "\"}", 200);
        }
        // seeded rider is online → auto-assigned the moment the order is ready
        assertThat(getJson("/api/v1/orders/" + orderId, customer(), 200).at("/data/status").asText()).isEqualTo("DELIVERY_ASSIGNED");
        assertThat(getJson("/api/v1/rider/orders", rider(), 200).at("/data")).hasSize(1);

        send(patch("/api/v1/orders/" + orderId + "/status"), rider(), "{\"status\":\"PICKED_UP\"}", 200);
        send(patch("/api/v1/orders/" + orderId + "/status"), rider(), "{\"status\":\"ON_THE_WAY\"}", 200);
        send(patch("/api/v1/orders/" + orderId + "/status"), rider(), "{\"status\":\"DELIVERED\",\"otp\":\"" + (otp.equals("0000") ? "1111" : "0000") + "\"}", 400);
        send(patch("/api/v1/orders/" + orderId + "/status"), rider(), "{\"status\":\"DELIVERED\",\"otp\":\"" + otp + "\"}", 200);

        JsonNode o = getJson("/api/v1/orders/" + orderId, customer(), 200).at("/data");
        assertThat(o.get("status").asText()).isEqualTo("DELIVERED");
        assertThat(o.at("/history").size()).isGreaterThanOrEqualTo(8);
        // delivered orders are final
        send(patch("/api/v1/orders/" + orderId + "/status"), customer(), "{\"status\":\"CANCELLED\"}", 409);
    }

    @Test @Order(10)
    void adminSeesRevenueAndAuditTrail() throws Exception {
        JsonNode m = getJson("/api/v1/admin/metrics", admin(), 200).at("/data");
        assertThat(m.get("gmv").decimalValue()).isEqualByComparingTo("875.25");
        assertThat(m.get("platformCommission").decimalValue()).isEqualByComparingTo("178.00");        // 20% of subtotal 890
        assertThat(getJson("/api/v1/admin/audit-logs", admin(), 200).at("/data").size()).isGreaterThan(5);
    }

    @Test @Order(11)
    void customerCanReviewDeliveredOrderOnce() throws Exception {
        String review = "{\"orderId\":" + orderId + ",\"foodRating\":5,\"deliveryRating\":4,\"comment\":\"Great\"}";
        send(post("/api/v1/reviews"), customer(), review, 200);
        send(post("/api/v1/reviews"), customer(), review, 409);
        send(post("/api/v1/reviews"), tokens.get("eve@example.com"), review, 404);
    }

    @Test @Order(12)
    void groceryStockCannotBeOversoldAndIsReleasedOnCancel() throws Exception {
        long bread = groceryId("Bread Loaf");                                                           // stock 20
        send(post("/api/v1/orders"), customer(), "{\"items\":[{\"productId\":" + bread + ",\"quantity\":21}]," + ADDRESS + "}", 409);
        JsonNode o = send(post("/api/v1/orders"), customer(), "{\"items\":[{\"productId\":" + bread + ",\"quantity\":20}]," + ADDRESS + "}", 200).at("/data");
        assertThat(o.get("grocery").asBoolean()).isTrue();
        assertThat(o.get("packagingFee").decimalValue()).isEqualByComparingTo("0");
        send(post("/api/v1/orders"), customer(), "{\"items\":[{\"productId\":" + bread + ",\"quantity\":1}]," + ADDRESS + "}", 409);   // sold out

        send(patch("/api/v1/orders/" + o.get("id").asLong() + "/status"), customer(), "{\"status\":\"CANCELLED\"}", 200);
        send(post("/api/v1/orders"), customer(), "{\"items\":[{\"productId\":" + bread + ",\"quantity\":20}]," + ADDRESS + "}", 200);   // stock is back
    }

    @Test @Order(13)
    void foodAndGroceryCannotBeMixedInOneOrder() throws Exception {
        long biryani = productId("Butter Chicken");
        long milk = groceryId("Fresh Milk 1L");
        send(post("/api/v1/orders"), customer(),
                "{\"items\":[{\"productId\":" + biryani + ",\"quantity\":1},{\"productId\":" + milk + ",\"quantity\":1}]," + ADDRESS + "}", 400);
    }

    @Test @Order(14)
    void refreshTokenRotatesAndReuseRevokesTheSession() throws Exception {
        MvcResult login = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"eve@example.com\",\"password\":\"" + EVE_PASSWORD + "\"}")).andExpect(status().isOk()).andReturn();
        var cookie = login.getResponse().getCookie("zestora_refresh");
        assertThat(cookie).isNotNull();
        assertThat(cookie.isHttpOnly()).isTrue();

        MvcResult refreshed = mvc.perform(post("/api/v1/auth/refresh").cookie(cookie)).andExpect(status().isOk()).andReturn();
        var newCookie = refreshed.getResponse().getCookie("zestora_refresh");
        assertThat(newCookie.getValue()).isNotEqualTo(cookie.getValue());

        mvc.perform(post("/api/v1/auth/refresh").cookie(cookie)).andExpect(status().isUnauthorized());      // old token re-used → theft
        mvc.perform(post("/api/v1/auth/refresh").cookie(newCookie)).andExpect(status().isUnauthorized());   // family revoked
    }

    @Test @Order(15)
    void restaurantOwnerManagesOnlyOwnMenu() throws Exception {
        long butter = productId("Butter Chicken");
        send(put("/api/v1/partner/products/" + butter), owner(), "{\"price\":300,\"available\":true}", 200);
        long fish = productId("Fish Curry Meals");                                                       // Coastal Bites, not Spice Garden
        send(put("/api/v1/partner/products/" + fish), owner(), "{\"price\":1}", 403);
        send(put("/api/v1/partner/products/" + butter), customer(), "{\"price\":1}", 403);
    }
}
