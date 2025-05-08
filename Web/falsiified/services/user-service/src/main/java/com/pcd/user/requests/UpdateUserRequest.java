package com.pcd.user.requests;

import com.pcd.dto.enums.Role;
import com.pcd.dto.records.AddressDTO;
import lombok.Data;

import java.util.List;

@Data
public  class UpdateUserRequest {
    private String firstname;
    private String lastname;
    private String email;
    private List<Role> role;
    private AddressDTO address;
    private Boolean active;
    private String password;

}