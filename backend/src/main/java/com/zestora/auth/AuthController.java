package com.zestora.auth;

import com.zestora.common.ApiResponse;
import com.zestora.config.AppProperties;
import com.zestora.security.AuthUser;
import com.zestora.user.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private static final String COOKIE = "zestora_refresh";
    private static final String COOKIE_PATH = "/api/v1/auth";

    private final AuthService auth;
    private final AppProperties props;

    public AuthController(AuthService auth, AppProperties props) {
        this.auth = auth;
        this.props = props;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
        return withCookie(auth.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return withCookie(auth.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> refresh(
            @CookieValue(name = COOKIE, required = false) String refreshToken) {
        return withCookie(auth.refresh(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@CookieValue(name = COOKIE, required = false) String refreshToken) {
        auth.logout(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString())
                .body(ApiResponse.ok(null));
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me() {
        return ApiResponse.ok(auth.me(AuthUser.current().id()));
    }

    private ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> withCookie(AuthService.Session s) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(s.refreshToken(), Duration.ofSeconds(auth.refreshTtlSeconds())).toString())
                .body(ApiResponse.ok(s.response()));
    }

    /** httpOnly (JS can't read it), SameSite=Strict (not sent cross-site), scoped to the auth endpoints only. */
    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from(COOKIE, value)
                .httpOnly(true)
                .secure(props.cookie().secure())
                .sameSite("Strict")
                .path(COOKIE_PATH)
                .maxAge(maxAge)
                .build();
    }
}
