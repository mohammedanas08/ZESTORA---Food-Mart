package com.zestora.seed;

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
 * Creates the first admin on an empty production database. It runs in every profile but only acts when both
 * ADMIN_EMAIL and ADMIN_PASSWORD are set in the environment, and it never touches an existing account.
 * Remove the two variables after the first start.
 */
@Slf4j
@Component
public class AdminBootstrap implements ApplicationRunner {
    static final int MIN_PASSWORD = 12;

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    public AdminBootstrap(UserRepository users, PasswordEncoder encoder,
                          @Value("${zestora.admin.email:}") String email, @Value("${zestora.admin.password:}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.email = email == null ? "" : email.trim().toLowerCase();
        this.password = password == null ? "" : password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isEmpty() && password.isEmpty()) return;
        if (email.isEmpty() || password.length() < MIN_PASSWORD) {
            throw new IllegalStateException("ADMIN_EMAIL and ADMIN_PASSWORD (at least " + MIN_PASSWORD + " characters) must both be set to create the first admin.");
        }
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            log.info("Admin bootstrap skipped: {} already exists", email);
            return;
        }
        User u = new User();
        u.setName("Administrator");
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(Role.SUPER_ADMIN);
        users.save(u);
        log.info("Created first admin account {}", email);
    }
}
