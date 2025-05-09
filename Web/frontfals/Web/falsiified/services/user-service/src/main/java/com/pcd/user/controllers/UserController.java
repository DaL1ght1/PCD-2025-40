package com.pcd.user.controllers;

import com.pcd.dto.ApiResponse;
import com.pcd.dto.records.UserResponseDTO;
import com.pcd.user.model.User;
import com.pcd.dto.records.UserRequest;
import com.pcd.user.requests.CreateUserRequest;
import com.pcd.user.requests.UserResponse;
import com.pcd.user.service.UserService;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userservice;
    private  final Logger logger = LoggerFactory.getLogger(UserController.class);



    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody @Valid CreateUserRequest request) {
        logger.info("Attempting to create new user with email: {}", request.getEmail());
        try {
            User user = userservice.createUser(request);
            UserResponse userResponse = UserResponse.fromUser(user);
            return ResponseEntity.ok(ApiResponse.success(userResponse, "User created successfully"));
        } catch (IllegalArgumentException e) {
            logger.error("Error creating user (bad request): {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error("Error creating user: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating user (internal server error): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    @PutMapping
    public ResponseEntity<Void> updateUser(@RequestBody @Valid UserRequest request) {
        userservice.updateUser(request);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/get-all")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userservice.getAllUsers());
    }

    @GetMapping("/exists/{id}")
    public ResponseEntity<Boolean> existsById(@PathVariable("id") String id) {
        return ResponseEntity.ok(userservice.existsById(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable("id") String id) {
        return ResponseEntity.ok(userservice.getUserById(id));
    }

    @GetMapping("/by-email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        return userservice.getByEmail(email);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable("id") String id) {
        userservice.deleteUserById(id);
        return ResponseEntity.accepted().build();
    }

    /**
     * Get the profile of the currently authenticated user
     * @return the user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<User> getUserProfile() {
        // Get the current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        // Assuming the username is the email in your application
        return userservice.getByEmail(currentUsername);
    }
}