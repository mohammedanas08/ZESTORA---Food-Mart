package com.zestora.seed;

import com.zestora.user.Role;
import com.zestora.user.User;
import com.zestora.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminBootstrapTest {
    private final UserRepository users = mock(UserRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);

    @Test
    void doesNothingWhenNotConfigured() throws Exception {
        new AdminBootstrap(users, encoder, "", "").run(null);
        verify(users, never()).save(any());
    }

    @Test
    void createsASuperAdminWithAHashedPassword() throws Exception {
        String pw = "random-" + System.nanoTime() + "-xyz";
        when(users.findByEmailIgnoreCase("boss@example.com")).thenReturn(Optional.empty());
        new AdminBootstrap(users, encoder, " Boss@Example.com ", pw).run(null);
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getRole()).isEqualTo(Role.SUPER_ADMIN);
        assertThat(saved.getValue().getEmail()).isEqualTo("boss@example.com");
        assertThat(saved.getValue().getPasswordHash()).isNotEqualTo(pw);
        assertThat(encoder.matches(pw, saved.getValue().getPasswordHash())).isTrue();
    }

    @Test
    void neverOverwritesAnExistingAccount() throws Exception {
        when(users.findByEmailIgnoreCase("boss@example.com")).thenReturn(Optional.of(new User()));
        new AdminBootstrap(users, encoder, "boss@example.com", "a-long-enough-password").run(null);
        verify(users, never()).save(any());
    }

    @Test
    void refusesAWeakOrIncompleteSetup() {
        assertThatThrownBy(() -> new AdminBootstrap(users, encoder, "boss@example.com", "short").run(null)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new AdminBootstrap(users, encoder, "", "a-long-enough-password").run(null)).isInstanceOf(IllegalStateException.class);
    }
}
