package com.pcd.dto.records;

import com.pcd.dto.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserCreationRequestDTO(
        @NotBlank String firstname,
        @NotBlank String lastname,
        @NotBlank @Email String email,
        @NotBlank String password, // Should be handled securely
        @NotNull Role role,
        AddressDTO address,
        @NotNull Boolean active // Assuming active status needs to be set on creation
) {}