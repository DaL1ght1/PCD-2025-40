package com.pcd.user.requests;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
class UserRequest {
    private String id;
    private String firstname;
    private String lastname;
    private String email;
    private String password;
    private String role;
    private String address;
    private Boolean active;
}