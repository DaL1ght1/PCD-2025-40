package com.pcd.user.model;

import com.pcd.dto.records.AddressDTO;
import org.springframework.stereotype.Service;

@Service
public class AddressMapper {
    public static AddressDTO toAddressDTO(Address address) {
        if (address == null) {
            return null;
        }
        return new AddressDTO(
                address.getStreet(),
                address.getCity(),
                address.getZip()
        );
    }

    // Include toAddress for completeness, if needed elsewhere
    public static Address toAddress(AddressDTO dto) {
        Address address = new Address();
        address.setStreet(dto.street());
        address.setCity(dto.city());
        address.setZip(dto.zipCode());
        return address;
    }
}