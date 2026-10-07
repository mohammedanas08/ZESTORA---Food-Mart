package com.zestora.security;

import com.zestora.config.AppProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window per-IP rate limit for login/register/refresh to slow brute-force attacks.
 * In-memory: good for a single instance; move to Redis when running several instances.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private record Window(long startMillis, int count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final int limit;

    public RateLimitFilter(AppProperties props) {
        this.limit = props.rateLimit().authPerMinute();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String p = req.getRequestURI();
        return !("POST".equals(req.getMethod())
                && (p.equals("/api/v1/auth/login") || p.equals("/api/v1/auth/register") || p.equals("/api/v1/auth/refresh")));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        String key = req.getRemoteAddr() + "|" + req.getRequestURI();
        Window w = windows.merge(key, new Window(now, 1),
                (old, fresh) -> now - old.startMillis() > 60_000 ? fresh : new Window(old.startMillis(), old.count() + 1));
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> now - e.getValue().startMillis() > 60_000);
        }
        if (w.count() > limit) {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"success\":false,\"error\":{\"code\":\"RATE_LIMITED\",\"message\":\"Too many attempts. Try again in a minute.\"}}");
            return;
        }
        chain.doFilter(req, res);
    }
}
