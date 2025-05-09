package com.pcd.dto.records;

import com.pcd.dto.enums.Role;
import jakarta.validation.constraints.Email;

public record UserUpdateRequestDTO(
        String firstname, // Optional fields for update
        String lastname,
        @Email String email, // Email might not be updatable, depends on requirements
        Role role,
        AddressDTO address,
        Boolean active
) {}