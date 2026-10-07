package com.zestora.security;

import com.zestora.common.ApiException;
import com.zestora.user.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** The authenticated principal, built from a verified JWT. */
public record AuthUser(Long id, String email, Role role) implements java.security.Principal {

    /** Principal name = user id, so WebSocket user destinations can address a specific user. */
    @Override
    public String getName() {
        return String.valueOf(id);
    }

    public static AuthUser current() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !(a.getPrincipal() instanceof AuthUser u)) {
            throw ApiException.unauthorized("Authentication required");
        }
        return u;
    }
}
