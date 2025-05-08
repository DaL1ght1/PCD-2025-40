package com.pcd.dto.records;

import com.pcd.dto.enums.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserResponseDTO(
        String id,
        String firstname,
        String lastname,
        String email,
        AddressDTO address,
        Role role, // Keep Role enum if it's simple enough, otherwise map to String
        LocalDateTime createdAt, // Assuming User model has this
        Boolean active,
        Boolean enabled // Added from User model
) {}