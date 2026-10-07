package com.zestora.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true)
    private String email;
    private String phone;
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    private Role role;
    private String avatarUrl;
    private boolean enabled = true;
    private Instant createdAt = Instant.now();
}
