package com.zestora.common;

import com.zestora.security.AuthUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}

/** Append-only audit trail of important mutations (who did what to which entity). */
@Service
public class AuditService {
    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void record(AuthUser actor, String action, String entity, Object entityId, String details) {
        AuditLog log = new AuditLog();
        if (actor != null) {
            log.setActorId(actor.id());
            log.setActorRole(actor.role().name());
        } else {
            log.setActorRole("SYSTEM");
        }
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId == null ? null : String.valueOf(entityId));
        log.setDetails(details != null && details.length() > 1000 ? details.substring(0, 1000) : details);
        repo.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> recent(int page, int size) {
        return repo.findAll(PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt")));
    }
}
