package com.pcd.user.service;


import com.pcd.user.requests.CreateUserRequest;
import org.apache.commons.lang3.StringUtils;
import com.pcd.dto.records.UserResponseDTO;
import com.pcd.exception.UserNotFoundException;
import com.pcd.user.model.Address;
import com.pcd.user.model.AddressMapper;
import com.pcd.dto.records.UserRequest;
import com.pcd.user.model.User;
import com.pcd.user.model.UserMapper;
import com.pcd.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static java.lang.String.format;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final AddressMapper addressMapper;



    public User createUser(CreateUserRequest request) {
        User user = new User();
        user.setFirstname(request.getFirstname());
        user.setLastname(request.getLastname());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setCreationDate(LocalDateTime.now());
        user.setActive(true); // Default for new users
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        user.setId(java.util.UUID.randomUUID().toString()); // Generate ID
        return repository.save(user);
    }


    public User updateUser(UserRequest request) {
        var user = repository.findById(request.id())
                .orElseThrow(() -> new UserNotFoundException(
                        format("Cannot Update user: User with id %s not found", request.id())
                ));
        mergeUser(user, request);
        return repository.save(user);
    }

    public void mergeUser(User user, UserRequest request) {
        if (StringUtils.isNotBlank(request.firstname())) {
            user.setFirstname(request.firstname());
        }
        if (StringUtils.isNotBlank(request.lastname())) {
            user.setLastname(request.lastname());
        }
        if (StringUtils.isNotBlank(request.email())) {
            user.setEmail(request.email());
        }
        if (StringUtils.isNotBlank(request.password())) {
            if (request.password().length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters");
            }
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (StringUtils.isNotBlank(request.role().toString())) {
            user.setRole(request.role());
        }
        if (request.active() != null) {
            user.setActive(request.active());
        }
        if (request.address() != null) {
            Address address = addressMapper.toAddress(request.address());
            user.setAddress(address);
        }
    }

    public List<UserResponseDTO> getAllUsers(){
        return repository.findAll()
                .stream().map(mapper::fromUser)
                .collect(Collectors.toList());
    }

    public boolean existsById(String id) {
        return repository.findById(id).isPresent();}

    public UserResponseDTO getUserById(String id) {
        return repository.findById(id)
                .map(mapper::fromUser)
                .orElseThrow(()->new UserNotFoundException(
                        format("Cannot Find user: User with id %s not found", id)
                ));
    }

    @Transactional
    public void deleteUserById(String id) {
        if (!existsById(id)) {
            throw new UserNotFoundException(
                    format("Cannot Delete user: User with id %s not found", id)
            );
        }
        repository.deleteById(id);
    }

    public ResponseEntity<User> getByEmail(String email){
       return  repository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
