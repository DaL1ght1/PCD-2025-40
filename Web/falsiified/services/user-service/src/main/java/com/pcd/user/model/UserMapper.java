package com.pcd.user.model;

import com.pcd.dto.records.AddressDTO;
import com.pcd.dto.records.UserRequest;
import com.pcd.dto.records.UserResponseDTO;
import org.springframework.stereotype.Service;

@Service
public class UserMapper {
    public User toUser(UserRequest request) {
        Address address = new Address();
        address.setStreet(request.address().street());
        address.setCity(request.address().city());
        address.setZip(request.address().zipCode());

        User user = new User();
        user.setFirstname(request.firstname());
        user.setLastname(request.lastname());
        user.setEmail(request.email());
        user.setAddress(address);
        return user;
    }

    public UserResponseDTO fromUser(User user) {
        AddressDTO addressDTO = null;
        if (user.getAddress() != null) {
            // Using AddressMapper instead of direct method on Address
            addressDTO = AddressMapper.toAddressDTO(user.getAddress());
        }

        return new UserResponseDTO(
                user.getId(),
                user.getFirstname(),
                user.getLastname(),
                user.getEmail(),
                addressDTO,
                user.getRole(),
                user.getCreationDate(),
                user.getActive(),
                user.isEnabled()// Make sure this field exists in User class
        );
    }
}