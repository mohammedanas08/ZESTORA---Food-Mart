package com.zestora.seed;

import com.zestora.delivery.DeliveryPartner;
import com.zestora.delivery.DeliveryPartnerRepository;
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

class RiderBootstrapTest {
    private final UserRepository users = mock(UserRepository.class);
    private final DeliveryPartnerRepository riders = mock(DeliveryPartnerRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);

    @Test
    void doesNothingWhenNotConfigured() throws Exception {
        new RiderBootstrap(users, riders, encoder, "", "", "").run(null);
        verify(users, never()).save(any());
    }

    @Test
    void createsARiderAndItsDeliveryProfile() throws Exception {
        String pw = "rider-" + System.nanoTime() + "-pw";
        when(users.findByEmailIgnoreCase("rider@example.com")).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenAnswer(i -> { User u = i.getArgument(0); u.setId(7L); return u; });
        new RiderBootstrap(users, riders, encoder, "Rider@Example.com", pw, "").run(null);
        ArgumentCaptor<User> u = ArgumentCaptor.forClass(User.class);
        verify(users).save(u.capture());
        assertThat(u.getValue().getRole()).isEqualTo(Role.DELIVERY_PARTNER);
        assertThat(u.getValue().getEmail()).isEqualTo("rider@example.com");
        assertThat(encoder.matches(pw, u.getValue().getPasswordHash())).isTrue();
        ArgumentCaptor<DeliveryPartner> dp = ArgumentCaptor.forClass(DeliveryPartner.class);
        verify(riders).save(dp.capture());
        assertThat(dp.getValue().getUserId()).isEqualTo(7L);
        assertThat(dp.getValue().getVehicleNumber()).as("no invented vehicle details").isNull();
    }

    @Test
    void neverTouchesAnExistingAccountAndRejectsWeakSetup() {
        when(users.findByEmailIgnoreCase("rider@example.com")).thenReturn(Optional.of(new User()));
        assertThatThrownBy(() -> new RiderBootstrap(users, riders, encoder, "rider@example.com", "short", "").run(null)).isInstanceOf(IllegalStateException.class);
    }
}
