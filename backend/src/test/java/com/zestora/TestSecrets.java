package com.zestora;

import org.springframework.test.context.DynamicPropertyRegistry;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Throw-away secrets generated fresh for every test run, so no credential is ever written in source code.
 * Dynamic properties have the highest precedence, so a developer's real backend/.env (e.g. real Razorpay keys)
 * can never leak into a test run.
 */
public final class TestSecrets {
    private static final SecureRandom RANDOM = new SecureRandom();

    public static final String JWT_SECRET = random(48);
    /** The password given to every demo account the seeder creates during tests. */
    public static final String DEMO_PASSWORD = random(16);

    private TestSecrets() {}

    public static String random(int bytes) {
        byte[] b = new byte[bytes];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    /** Call from a {@code @DynamicPropertySource} method. */
    public static void register(DynamicPropertyRegistry registry) {
        registry.add("zestora.jwt.secret", () -> JWT_SECRET);
        registry.add("zestora.dev.demo-password", () -> DEMO_PASSWORD);
        // Force the built-in payment simulator and no uploads, whatever the developer's .env contains.
        registry.add("zestora.razorpay.key-id", () -> "");
        registry.add("zestora.razorpay.key-secret", () -> "");
        registry.add("zestora.razorpay.webhook-secret", () -> "");
        registry.add("zestora.cloudinary.cloud-name", () -> "");
        registry.add("zestora.cloudinary.api-key", () -> "");
        registry.add("zestora.cloudinary.api-secret", () -> "");
    }
}
