package com.zestora.support;

import com.zestora.common.ApiException;
import com.zestora.common.ApiResponse;
import com.zestora.order.OrderRepository;
import com.zestora.security.AuthUser;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "support_tickets")
@Getter @Setter @NoArgsConstructor
class SupportTicket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String ticketNo;
    private Long userId;
    private Long orderId;
    private String category;
    private String subject;
    private String status = "OPEN";
    private Instant createdAt = Instant.now();
}

@Entity
@Table(name = "ticket_messages")
@Getter @Setter @NoArgsConstructor
class TicketMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ticketId;
    private Long senderId;
    private String message;
    private Instant createdAt = Instant.now();
}

interface TicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<SupportTicket> findAllByOrderByCreatedAtDesc();
}

interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {
    List<TicketMessage> findByTicketIdOrderByIdAsc(Long ticketId);
}

@Service
class SupportService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final TicketRepository tickets;
    private final TicketMessageRepository messages;
    private final OrderRepository orders;

    SupportService(TicketRepository tickets, TicketMessageRepository messages, OrderRepository orders) {
        this.tickets = tickets;
        this.messages = messages;
        this.orders = orders;
    }

    @Transactional
    public SupportController.TicketDto open(AuthUser user, SupportController.OpenRequest req) {
        if (req.orderId() != null && orders.findById(req.orderId()).filter(o -> o.getCustomerId().equals(user.id())).isEmpty()) {
            throw ApiException.notFound("Order not found");
        }
        SupportTicket t = new SupportTicket();
        t.setTicketNo("TKT-" + (10000 + RANDOM.nextInt(90000)));
        t.setUserId(user.id());
        t.setOrderId(req.orderId());
        t.setCategory(req.category());
        t.setSubject(req.subject());
        tickets.save(t);
        addMessage(t, user, req.message());
        return dto(t);
    }

    @Transactional
    public SupportController.TicketDto reply(AuthUser user, Long ticketId, String text) {
        SupportTicket t = visible(user, ticketId);
        addMessage(t, user, text);
        if (user.role().isAdmin() || user.role() == com.zestora.user.Role.SUPPORT_AGENT) t.setStatus("ANSWERED");
        return dto(t);
    }

    @Transactional(readOnly = true)
    public SupportController.TicketDto get(AuthUser user, Long ticketId) {
        return dto(visible(user, ticketId));
    }

    @Transactional(readOnly = true)
    public List<SupportController.TicketDto> mine(AuthUser user) {
        return tickets.findByUserIdOrderByCreatedAtDesc(user.id()).stream().map(this::dto).toList();
    }

    @Transactional(readOnly = true)
    public List<SupportController.TicketDto> all() {
        return tickets.findAllByOrderByCreatedAtDesc().stream().map(this::dto).toList();
    }

    private SupportTicket visible(AuthUser user, Long id) {
        SupportTicket t = tickets.findById(id).orElseThrow(() -> ApiException.notFound("Ticket not found"));
        boolean staff = user.role().isAdmin() || user.role() == com.zestora.user.Role.SUPPORT_AGENT;
        if (!staff && !t.getUserId().equals(user.id())) throw ApiException.notFound("Ticket not found");
        return t;
    }

    private void addMessage(SupportTicket t, AuthUser user, String text) {
        TicketMessage m = new TicketMessage();
        m.setTicketId(t.getId());
        m.setSenderId(user.id());
        m.setMessage(text);
        messages.save(m);
    }

    private SupportController.TicketDto dto(SupportTicket t) {
        return new SupportController.TicketDto(t.getId(), t.getTicketNo(), t.getOrderId(), t.getCategory(), t.getSubject(), t.getStatus(),
                t.getCreatedAt(), messages.findByTicketIdOrderByIdAsc(t.getId()).stream()
                .map(m -> new SupportController.MessageDto(m.getSenderId(), m.getMessage(), m.getCreatedAt())).toList());
    }
}

@RestController
@RequestMapping("/api/v1")
class SupportController {
    record OpenRequest(Long orderId, @NotBlank @Size(max = 40) String category, @NotBlank @Size(max = 200) String subject,
                       @NotBlank @Size(max = 2000) String message) {}

    record ReplyRequest(@NotBlank @Size(max = 2000) String message) {}

    record MessageDto(Long senderId, String message, Instant at) {}

    record TicketDto(Long id, String ticketNo, Long orderId, String category, String subject, String status,
                     Instant createdAt, List<MessageDto> messages) {}

    private final SupportService service;

    SupportController(SupportService service) {
        this.service = service;
    }

    @PostMapping("/support/tickets")
    ApiResponse<TicketDto> open(@Valid @RequestBody OpenRequest req) {
        return ApiResponse.ok(service.open(AuthUser.current(), req));
    }

    @GetMapping("/support/tickets/me")
    ApiResponse<List<TicketDto>> mine() {
        return ApiResponse.ok(service.mine(AuthUser.current()));
    }

    @GetMapping("/support/tickets/{id}")
    ApiResponse<TicketDto> get(@PathVariable Long id) {
        return ApiResponse.ok(service.get(AuthUser.current(), id));
    }

    @PostMapping("/support/tickets/{id}/messages")
    ApiResponse<TicketDto> reply(@PathVariable Long id, @Valid @RequestBody ReplyRequest req) {
        return ApiResponse.ok(service.reply(AuthUser.current(), id, req.message()));
    }

    @GetMapping("/admin/support/tickets")
    ApiResponse<List<TicketDto>> all() {
        return ApiResponse.ok(service.all());
    }
}
