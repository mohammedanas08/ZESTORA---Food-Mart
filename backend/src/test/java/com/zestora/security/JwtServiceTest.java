package com.zestora.security;

import com.zestora.config.AppProperties;
import com.zestora.user.Role;
import com.zestora.user.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {
    private static JwtService service(String secret, long ttlMinutes) {
        var props = new AppProperties(new AppProperties.Jwt(secret, ttlMinutes, 14), null, null, null, null, null, null, null);
        var s = new JwtService(props);
        s.init();
        return s;
    }

    private static User user() {
        User u = new User();
        u.setId(7L);
        u.setEmail("a@b.com");
        u.setRole(Role.RESTAURANT_OWNER);
        return u;
    }

    @Test
    void roundTripKeepsIdAndRole() {
        JwtService s = service("0123456789abcdef0123456789abcdef", 15);
        AuthUser parsed = s.parse(s.createAccessToken(user())).orElseThrow();
        assertThat(parsed.id()).isEqualTo(7L);
        assertThat(parsed.role()).isEqualTo(Role.RESTAURANT_OWNER);
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService s = service("0123456789abcdef0123456789abcdef", 15);
        String token = s.createAccessToken(user());
        String[] parts = token.split("\\.");
        // swap in a forged payload claiming ADMIN but keep the old signature
        String forged = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"7\",\"email\":\"a@b.com\",\"role\":\"ADMIN\",\"exp\":9999999999}".getBytes());
        assertThat(s.parse(parts[0] + "." + forged + "." + parts[2])).isEmpty();
        assertThat(s.parse("garbage")).isEmpty();
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String token = service("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 15).createAccessToken(user());
        assertThat(service("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", 15).parse(token)).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService s = service("0123456789abcdef0123456789abcdef", -1);
        assertThat(s.parse(s.createAccessToken(user()))).isEmpty();
    }

    @Test
    void shortOrMissingSecretFailsFast() {
        assertThatThrownBy(() -> service("short", 15)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> service(null, 15)).isInstanceOf(IllegalStateException.class);
    }
}
