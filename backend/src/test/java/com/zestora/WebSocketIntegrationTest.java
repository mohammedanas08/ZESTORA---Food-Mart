package com.zestora;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.reflect.Type;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

/**
 * Real WebSocket (STOMP) connections against a running server and a real PostgreSQL:
 * authentication on CONNECT, per-topic subscription authorisation, no client SEND, and live pushes after commit.
 */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class WebSocketIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void secrets(DynamicPropertyRegistry registry) {
        TestSecrets.register(registry);
    }

    @LocalServerPort int port;
    @Autowired TestRestTemplate http;
    @Autowired ObjectMapper json;

    private WebSocketStompClient stomp;

    @BeforeAll
    void setUp() {
        stomp = new WebSocketStompClient(new StandardWebSocketClient());
        stomp.setMessageConverter(new MappingJackson2MessageConverter());
    }

    @AfterAll
    void tearDown() {
        stomp.stop();
    }

    // ───────────── helpers ─────────────

    private String login(String email, String password) throws Exception {
        var res = http.postForEntity("/api/v1/auth/login", jsonEntity(null, Map.of("email", email, "password", password)), String.class);
        return json.readTree(res.getBody()).at("/data/accessToken").asText();
    }

    private HttpEntity<Object> jsonEntity(String token, Object body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) h.setBearerAuth(token);
        return new HttpEntity<>(body, h);
    }

    private JsonNode call(HttpMethod method, String path, String token, Object body) throws Exception {
        var res = http.exchange(path, method, jsonEntity(token, body), String.class);
        return json.readTree(res.getBody());
    }

    private long productId(String name) throws Exception {
        for (JsonNode r : call(HttpMethod.GET, "/api/v1/restaurants", null, null).at("/data")) {
            for (JsonNode i : call(HttpMethod.GET, "/api/v1/restaurants/" + r.get("id").asLong(), null, null).at("/data/items")) {
                if (i.get("name").asText().equals(name)) return i.get("id").asLong();
            }
        }
        throw new AssertionError("no product " + name);
    }

    /** Places an order as the demo customer and returns its id. */
    private long placeOrder(String customerToken) throws Exception {
        Map<String, Object> req = Map.of(
                "items", List.of(Map.of("productId", productId("Butter Chicken"), "quantity", 1)),
                "address", Map.of("street", "Main Road", "city", "Bhatkal"));
        return call(HttpMethod.POST, "/api/v1/orders", customerToken, req).at("/data/id").asLong();
    }

    private StompSession connect(String token) throws Exception {
        StompHeaders headers = new StompHeaders();
        if (token != null) headers.add("Authorization", "Bearer " + token);
        return stomp.connectAsync("ws://localhost:" + port + "/ws", new WebSocketHttpHeaders(), headers,
                new StompSessionHandlerAdapter() {}).get(10, TimeUnit.SECONDS);
    }

    private BlockingQueue<Map<String, Object>> subscribe(StompSession s, String topic) {
        BlockingQueue<Map<String, Object>> q = new LinkedBlockingQueue<>();
        s.subscribe(topic, new StompSessionHandlerAdapter() {
            @Override public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @SuppressWarnings("unchecked")
            @Override public void handleFrame(StompHeaders headers, Object payload) { q.add((Map<String, Object>) payload); }
        });
        return q;
    }

    // ───────────── tests ─────────────

    @Test
    void connectionWithoutAValidTokenIsRejected() {
        assertThatThrownBy(() -> connect(null)).isNotNull();
        assertThatThrownBy(() -> connect("not.a.jwt")).isNotNull();
    }

    @Test
    void customerReceivesLiveUpdatesForTheirOwnOrder() throws Exception {
        String customer = login("customer@zestora.com", TestSecrets.DEMO_PASSWORD);
        String owner = login("spicegarden@zestora.local", TestSecrets.DEMO_PASSWORD);
        long orderId = placeOrder(customer);

        StompSession session = connect(customer);
        BlockingQueue<Map<String, Object>> updates = subscribe(session, "/topic/order/" + orderId);
        Thread.sleep(500); // let the broker register the subscription

        call(HttpMethod.POST, "/api/v1/payments/" + orderId + "/checkout", customer, null);
        call(HttpMethod.POST, "/api/v1/payments/" + orderId + "/simulate", customer, null);
        Map<String, Object> confirmed = updates.poll(5, TimeUnit.SECONDS);
        assertThat(confirmed).isNotNull();
        assertThat(confirmed.get("status")).isEqualTo("CONFIRMED");
        assertThat(confirmed.get("orderId")).isEqualTo((int) orderId);

        call(HttpMethod.PATCH, "/api/v1/orders/" + orderId + "/status", owner, Map.of("status", "RESTAURANT_ACCEPTED"));
        Map<String, Object> accepted = updates.poll(5, TimeUnit.SECONDS);
        assertThat(accepted).isNotNull();
        assertThat(accepted.get("status")).isEqualTo("RESTAURANT_ACCEPTED");

        session.disconnect();
    }

    @Test
    void anotherCustomerCannotListenToSomeoneElsesOrder() throws Exception {
        String customer = login("customer@zestora.com", TestSecrets.DEMO_PASSWORD);
        long orderId = placeOrder(customer);

        var reg = http.postForEntity("/api/v1/auth/register", jsonEntity(null,
                Map.of("name", "Mallory", "email", "mallory@example.com", "password", TestSecrets.random(12))), String.class);
        String mallory = json.readTree(reg.getBody()).at("/data/accessToken").asText();

        StompSession session = connect(mallory);
        subscribe(session, "/topic/order/" + orderId);
        // The server answers the forbidden SUBSCRIBE by closing the connection.
        await().atMost(Duration.ofSeconds(5)).until(() -> !session.isConnected());
    }

    @Test
    void onlyAdminsMaySubscribeToTheLiveAdminTopicAndClientsCannotSend() throws Exception {
        String customer = login("customer@zestora.com", TestSecrets.DEMO_PASSWORD);
        StompSession s1 = connect(customer);
        subscribe(s1, "/topic/admin/live");
        await().atMost(Duration.ofSeconds(5)).until(() -> !s1.isConnected());

        StompSession s2 = connect(customer);
        s2.send("/app/anything", Map.of("x", 1));
        await().atMost(Duration.ofSeconds(5)).until(() -> !s2.isConnected());

        String admin = login("admin@zestora.com", TestSecrets.DEMO_PASSWORD);
        StompSession s3 = connect(admin);
        subscribe(s3, "/topic/admin/live");
        Thread.sleep(800);
        assertThat(s3.isConnected()).isTrue();
        s3.disconnect();
    }

    @Test
    void kitchenOnlyHearsAboutItsOwnRestaurantAndRiderGetsJobsOnPersonalQueue() throws Exception {
        String owner = login("spicegarden@zestora.local", TestSecrets.DEMO_PASSWORD);
        String customer = login("customer@zestora.com", TestSecrets.DEMO_PASSWORD);
        String rider = login("rahul.rider@zestora.local", TestSecrets.DEMO_PASSWORD);
        long restaurantId = call(HttpMethod.GET, "/api/v1/partner/restaurant", owner, null).at("/data/restaurant/id").asLong();
        long otherRestaurant = restaurantId == 1 ? 2 : 1;

        // Spice Garden's staff may NOT subscribe to another restaurant's feed.
        StompSession wrong = connect(owner);
        subscribe(wrong, "/topic/restaurant/" + otherRestaurant + "/orders");
        await().atMost(Duration.ofSeconds(5)).until(() -> !wrong.isConnected());

        StompSession kitchen = connect(owner);
        BlockingQueue<Map<String, Object>> kitchenFeed = subscribe(kitchen, "/topic/restaurant/" + restaurantId + "/orders");
        StompSession riderSession = connect(rider);
        BlockingQueue<Map<String, Object>> jobs = subscribe(riderSession, "/user/queue/jobs");
        Thread.sleep(800);

        // Drive an order through to READY_FOR_PICKUP; the online demo rider is auto-assigned.
        long orderId = placeOrder(customer);
        call(HttpMethod.POST, "/api/v1/payments/" + orderId + "/checkout", customer, null);
        call(HttpMethod.POST, "/api/v1/payments/" + orderId + "/simulate", customer, null);
        for (String s : new String[]{"RESTAURANT_ACCEPTED", "PREPARING", "READY_FOR_PICKUP"}) {
            call(HttpMethod.PATCH, "/api/v1/orders/" + orderId + "/status", owner, Map.of("status", s));
        }

        assertThat(drain(kitchenFeed, "READY_FOR_PICKUP")).as("kitchen saw READY_FOR_PICKUP").isTrue();
        assertThat(drain(jobs, "DELIVERY_ASSIGNED")).as("rider was offered the job on /user/queue/jobs").isTrue();

        kitchen.disconnect();
        riderSession.disconnect();
    }

    /** Waits until a message with the given status shows up in the queue. */
    private static boolean drain(BlockingQueue<Map<String, Object>> q, String status) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 8000;
        while (System.currentTimeMillis() < deadline) {
            Map<String, Object> m = q.poll(500, TimeUnit.MILLISECONDS);
            if (m != null && status.equals(m.get("status"))) return true;
        }
        return false;
    }
}
