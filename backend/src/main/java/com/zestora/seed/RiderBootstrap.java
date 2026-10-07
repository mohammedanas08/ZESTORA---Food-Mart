package com.zestora.seed;

import com.zestora.delivery.DeliveryPartner;
import com.zestora.delivery.DeliveryPartnerRepository;
import com.zestora.user.Role;
import com.zestora.user.User;
import com.zestora.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates a delivery rider account from the environment (RIDER_EMAIL, RIDER_PASSWORD, optional RIDER_NAME), in any profile.
 * Does nothing when the variables are empty and never changes an existing account. Vehicle details are left empty on purpose.
 */
@Slf4j
@Component
public class RiderBootstrap implements ApplicationRunner {
    private final UserRepository users;
    private final DeliveryPartnerRepository riders;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;
    private final String name;

    public RiderBootstrap(UserRepository users, DeliveryPartnerRepository riders, PasswordEncoder encoder,
                          @Value("${zestora.rider.email:}") String email, @Value("${zestora.rider.password:}") String password,
                          @Value("${zestora.rider.name:}") String name) {
        this.users = users;
        this.riders = riders;
        this.encoder = encoder;
        this.email = email == null ? "" : email.trim().toLowerCase();
        this.password = password == null ? "" : password;
        this.name = name == null || name.isBlank() ? "Demo Rider" : name.trim();
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isEmpty() && password.isEmpty()) return;
        if (email.isEmpty() || password.length() < AdminBootstrap.MIN_PASSWORD) {
            throw new IllegalStateException("RIDER_EMAIL and RIDER_PASSWORD (at least " + AdminBootstrap.MIN_PASSWORD + " characters) must both be set to create a rider.");
        }
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            log.info("Rider bootstrap skipped: {} already exists", email);
            return;
        }
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(Role.DELIVERY_PARTNER);
        u = users.save(u);
        DeliveryPartner dp = new DeliveryPartner();
        dp.setUserId(u.getId());
        dp.setOnline(true);
        riders.save(dp);
        log.info("Created rider account {}", email);
    }
}
