package com.zestora.auth;

import com.zestora.user.UserDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 160) String email,
            @Pattern(regexp = "^[+0-9 ()-]{7,20}$", message = "invalid phone") String phone,
            @NotBlank @Size(min = 8, max = 72, message = "must be 8-72 characters") String password) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    /** Access token goes in the body; the refresh token travels only in an httpOnly cookie. */
    public record AuthResponse(String accessToken, long expiresInSeconds, UserDto user) {}
}
