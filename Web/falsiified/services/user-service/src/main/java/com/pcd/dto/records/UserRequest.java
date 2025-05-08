package com.pcd.dto.records;

import com.pcd.dto.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;


public record UserRequest
        (String id,
         @NotNull(message = "Customer firstname is required")
         String firstname,

         @NotNull(message = "Customer lastname is required")
         String lastname,

         @Email(message = "Customer email is not a valid email address")
         String email,
         @NotNull
         String password,
         @NotNull
         Role role,

         AddressDTO address,
         Boolean active) {


}



