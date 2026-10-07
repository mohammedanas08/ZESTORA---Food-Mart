package com.zestora.security;

import com.zestora.config.AppProperties;
import com.zestora.user.Role;
import com.zestora.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** Issues and verifies short-lived HS256 access tokens. Refresh tokens are opaque and handled by AuthService. */
@Service
public class JwtService {
    private final AppProperties props;
    private SecretKey key;

    public JwtService(AppProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        String secret = props.jwt().secret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("zestora.jwt.secret (JWT_SECRET) must be set and at least 32 bytes long");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofMinutes(props.jwt().accessTtlMinutes()))))
                .signWith(key)
                .compact();
    }

    public long accessTtlSeconds() {
        return Duration.ofMinutes(props.jwt().accessTtlMinutes()).toSeconds();
    }

    /** Returns the principal if the token is valid and unexpired, otherwise empty. */
    public Optional<AuthUser> parse(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(new AuthUser(Long.valueOf(c.getSubject()), c.get("email", String.class),
                    Role.valueOf(c.get("role", String.class))));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
