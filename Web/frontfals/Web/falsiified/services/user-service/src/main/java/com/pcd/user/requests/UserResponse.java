package com.pcd.user.requests;

import com.pcd.dto.enums.Role;
import com.pcd.user.model.User;

public record UserResponse(
        String id,
        String firstname,
        String lastname,
        String email,
        Role role,
        Boolean active
) {
    public static UserResponse fromUser(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstname(),
                user.getLastname(),
                user.getEmail(),
                user.getRole(),
                user.getActive()
        );
    }
}