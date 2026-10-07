package com.zestora.config;

import com.zestora.catalog.RestaurantRepository;
import com.zestora.order.OrderAccess;
import com.zestora.order.OrderRepository;
import com.zestora.security.AuthUser;
import com.zestora.security.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * STOMP over WebSocket at /ws.
 *   CONNECT must carry "Authorization: Bearer <access token>".
 *   SUBSCRIBE is authorised per destination:
 *     /topic/order/{id}                  → people involved in that order
 *     /topic/restaurant/{id}/orders      → that restaurant's staff
 *     /topic/admin/**                    → admins
 *     /user/queue/**                     → the signed-in user (their own queue only)
 *   Clients cannot SEND to the broker (there are no @MessageMapping handlers).
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private static final Pattern ORDER = Pattern.compile("^/topic/order/(\\d+)(/location)?$");
    private static final Pattern RESTAURANT = Pattern.compile("^/topic/restaurant/(\\d+)/orders$");

    private final AppProperties props;
    private final JwtService jwt;
    private final OrderRepository orders;
    private final OrderAccess orderAccess;
    private final RestaurantRepository restaurants;

    public WebSocketConfig(AppProperties props, JwtService jwt, OrderRepository orders, OrderAccess orderAccess,
                           RestaurantRepository restaurants) {
        this.props = props;
        this.jwt = jwt;
        this.orders = orders;
        this.orderAccess = orderAccess;
        this.restaurants = restaurants;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins(props.cors().allowedOrigins().toArray(new String[0]));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setUserDestinationPrefix("/user");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (acc == null || acc.getCommand() == null) return message;

                if (StompCommand.CONNECT.equals(acc.getCommand())) {
                    String h = acc.getFirstNativeHeader("Authorization");
                    AuthUser user = h != null && h.startsWith("Bearer ") ? jwt.parse(h.substring(7)).orElse(null) : null;
                    if (user == null) throw new MessagingException("Unauthorized");
                    acc.setUser(new UsernamePasswordAuthenticationToken(user, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name()))));
                } else if (StompCommand.SUBSCRIBE.equals(acc.getCommand())) {
                    AuthUser user = userOf(acc);
                    if (user == null || !canSubscribe(user, acc.getDestination())) throw new MessagingException("Forbidden");
                } else if (StompCommand.SEND.equals(acc.getCommand())) {
                    throw new MessagingException("Forbidden");
                }
                return message;
            }
        });
    }

    private static AuthUser userOf(StompHeaderAccessor acc) {
        return acc.getUser() instanceof UsernamePasswordAuthenticationToken t && t.getPrincipal() instanceof AuthUser u ? u : null;
    }

    private boolean canSubscribe(AuthUser user, String dest) {
        if (dest == null) return false;
        if (dest.startsWith("/user/queue/")) return true;
        if (dest.startsWith("/topic/admin/")) return user.role().isAdmin();
        Matcher m = ORDER.matcher(dest);
        if (m.matches()) {
            return orders.findById(Long.valueOf(m.group(1))).map(o -> orderAccess.canView(user, o)).orElse(false);
        }
        m = RESTAURANT.matcher(dest);
        if (m.matches()) {
            if (user.role().isAdmin()) return true;
            Long rid = Long.valueOf(m.group(1));
            return restaurants.findByOwnerId(user.id()).filter(r -> r.getId().equals(rid)).isPresent();
        }
        return false;
    }
}
