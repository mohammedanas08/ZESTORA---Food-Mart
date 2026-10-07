package com.zestora.user;

/** Public view of a user. Never contains the password hash. */
public record UserDto(Long id, String name, String email, String phone, Role role, String avatarUrl) {
    public static UserDto of(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(), u.getAvatarUrl());
    }
}
