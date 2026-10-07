package com.zestora.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter @Setter @NoArgsConstructor
public class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    /** SHA-256 of the token; the raw token is never stored. */
    private String tokenHash;
    private Instant expiresAt;
    private boolean revoked;
    private Instant createdAt = Instant.now();
}
