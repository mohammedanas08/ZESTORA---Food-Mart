package com.zestora.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long actorId;
    private String actorRole;
    private String action;
    private String entity;
    private String entityId;
    private String details;
    private Instant createdAt = Instant.now();
}
