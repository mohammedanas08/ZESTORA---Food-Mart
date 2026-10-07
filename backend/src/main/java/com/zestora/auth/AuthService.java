package com.zestora.auth;

import com.zestora.common.ApiException;
import com.zestora.common.AuditService;
import com.zestora.config.AppProperties;
import com.zestora.security.AuthUser;
import com.zestora.security.JwtService;
import com.zestora.user.Role;
import com.zestora.user.User;
import com.zestora.user.UserDto;
import com.zestora.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthService {
    /** An issued session: the response body plus the raw refresh token to put in the cookie. */
    public record Session(AuthDtos.AuthResponse response, String refreshToken) {}

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;
    private final AuditService audit;
    /** Used to burn the same CPU time when the email is unknown, so response time does not reveal valid emails. */
    private final String dummyHash;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens, PasswordEncoder encoder,
                       JwtService jwt, AppProperties props, AuditService audit) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.props = props;
        this.audit = audit;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    @Transactional
    public Session register(AuthDtos.RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPhone(req.phone());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(Role.CUSTOMER);               // self-registration is ALWAYS a customer
        users.save(u);
        audit.record(new AuthUser(u.getId(), email, u.getRole()), "USER_REGISTERED", "User", u.getId(), null);
        return issue(u);
    }

    @Transactional
    public Session login(AuthDtos.LoginRequest req) {
        User u = users.findByEmailIgnoreCase(req.email().trim()).orElse(null);
        boolean ok = encoder.matches(req.password(), u != null ? u.getPasswordHash() : dummyHash);
        if (u == null || !ok || !u.isEnabled()) {
            throw ApiException.unauthorized("Incorrect email or password");
        }
        return issue(u);
    }

    /** Rotates the refresh token. Re-use of an already-rotated token revokes the whole session family. */
    @Transactional(noRollbackFor = ApiException.class)
    public Session refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) throw ApiException.unauthorized("Missing refresh token");
        RefreshToken t = refreshTokens.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
        if (t.isRevoked()) {
            refreshTokens.revokeAllForUser(t.getUserId());           // theft detected
            throw ApiException.unauthorized("Refresh token re-use detected; please log in again");
        }
        if (t.getExpiresAt().isBefore(Instant.now())) throw ApiException.unauthorized("Refresh token expired");
        t.setRevoked(true);
        User u = users.findById(t.getUserId()).filter(User::isEnabled)
                .orElseThrow(() -> ApiException.unauthorized("Account disabled"));
        return issue(u);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        refreshTokens.findByTokenHash(hash(rawToken)).ifPresent(t -> t.setRevoked(true));
    }

    @Transactional(readOnly = true)
    public UserDto me(Long userId) {
        return users.findById(userId).map(UserDto::of).orElseThrow(() -> ApiException.unauthorized("Unknown user"));
    }

    public long refreshTtlSeconds() {
        return Duration.ofDays(props.jwt().refreshTtlDays()).toSeconds();
    }

    private Session issue(User u) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken rt = new RefreshToken();
        rt.setUserId(u.getId());
        rt.setTokenHash(hash(raw));
        rt.setExpiresAt(Instant.now().plus(Duration.ofDays(props.jwt().refreshTtlDays())));
        refreshTokens.save(rt);
        var body = new AuthDtos.AuthResponse(jwt.createAccessToken(u), jwt.accessTtlSeconds(), UserDto.of(u));
        return new Session(body, raw);
    }

    static String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
