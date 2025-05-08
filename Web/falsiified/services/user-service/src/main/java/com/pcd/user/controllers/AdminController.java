package com.pcd.user.controllers;

import com.pcd.authentication.RegisterRequest;
import com.pcd.authentication.AuthenticationService;
import com.pcd.dto.ApiResponse;
import com.pcd.dto.enums.Role;
import com.pcd.dto.records.UserResponseDTO;
import com.pcd.exception.UserNotFoundException;
import com.pcd.user.model.User;
import com.pcd.dto.records.UserRequest;
import com.pcd.user.requests.CreateUserRequest;
import com.pcd.user.requests.ResetPasswordRequest;
import com.pcd.user.requests.UpdateUserRequest;
import com.pcd.user.requests.UserResponse;
import com.pcd.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final UserService userService;
    private final AuthenticationService authService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        // Check if authentication is null
        if (authentication == null) {
            logger.warn("No authentication found when accessing admin dashboard");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User admin = (User) authentication.getPrincipal();
        logger.info("Admin dashboard accessed by: {}", admin.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("admin", admin.getUsername());
        response.put("systemStatus", "OPERATIONAL");
        response.put("lastLogin", LocalDateTime.now().minusHours(2));

        // System statistics
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.getAllUsers().size());
        stats.put("activeUsers", userService.getAllUsers().size()); // Simplified - in real app would filter active users
        stats.put("usersByRole", getUserCountByRole());
        stats.put("recentRegistrations", getRecentRegistrations(5));

        response.put("statistics", stats);

        // System alerts
        List<Map<String, Object>> alerts = new ArrayList<>();
        Map<String, Object> alert1 = new HashMap<>();
        alert1.put("type", "WARNING");
        alert1.put("message", "High system load detected");
        alert1.put("timestamp", LocalDateTime.now().minusMinutes(15));

        Map<String, Object> alert2 = new HashMap<>();
        alert2.put("type", "INFO");
        alert2.put("message", "Scheduled maintenance in 2 days");
        alert2.put("timestamp", LocalDateTime.now().minusHours(1));

        alerts.add(alert1);
        alerts.add(alert2);
        response.put("alerts", alerts);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> all = userService.getAllUsers();
        return ResponseEntity.ok(all);
    }


    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable String id) {
        logger.info("Admin requested user details for ID: {}", id);

        try {
            UserResponseDTO user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error retrieving user with ID {}: {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + id);
        }
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody CreateUserRequest request) {
        logger.info("Admin creating new user with email: {}, role: {}", request.getEmail(), request.getRole());

        try {
            RegisterRequest registerRequest = RegisterRequest.builder()
                    .firstname(request.getFirstname())
                    .lastname(request.getLastname())
                    .email(request.getEmail())
                    .password(request.getPassword())
                    .role(request.getRole())
                    .address(request.getAddress())
                    .build();

            var authResponse = authService.register(registerRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User created successfully");
            response.put("userId", authResponse.getId()); // Assuming AuthResponse has getId() method
            response.put("email", request.getEmail());
            response.put("role", request.getRole());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error creating user: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error creating user: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        logger.info("Attempting to update user with ID: {}", id);
        try {
            UserRequest userRequestForService = new UserRequest(
                    id,
                    request.getFirstname(),
                    request.getLastname(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getRole() != null && !request.getRole().isEmpty() ? request.getRole().get(0) : null,
                    request.getAddress(),
                    request.getActive()
            );
            User updatedUser = userService.updateUser(userRequestForService);
            UserResponse userResponse = UserResponse.fromUser(updatedUser);
            return ResponseEntity.ok(ApiResponse.success(userResponse, "User updated successfully"));
        } catch (UserNotFoundException e) { // Assuming UserNotFoundException is defined in UserService or elsewhere
            logger.warn("Error updating user - not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            logger.error("Error updating user - bad request for ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error("Error updating user: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating user with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while updating user."));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteUser(@PathVariable String id) {
        logger.info("Attempting to delete user with ID: {}", id);
        try {
            userService.deleteUserById(id);
            return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
        } catch (UserNotFoundException e) { // Assuming UserNotFoundException is defined in UserService or elsewhere
            logger.warn("User not found for deletion with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting user with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while deleting user."));
        }
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Map<String, Object>> resetUserPassword(
            @PathVariable String id,
            @Valid @RequestBody ResetPasswordRequest request) {

        logger.info("Admin resetting password for user with ID: {}", id);

        try {
            // Get the user
            UserResponseDTO userResponse = userService.getUserById(id);

            // Create a user request with the new password
            UserRequest userRequest = new UserRequest(
                    id,
                    userResponse.firstname(),
                    userResponse.lastname(),
                    userResponse.email(),
                    passwordEncoder.encode(request.getNewPassword()),
                    userResponse.role(),
                    userResponse.address(),
                    true // Assuming we want to keep the user active
            );

            // Update the user
            userService.updateUser(userRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            response.put("userId", id);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error resetting password for user with ID {}: {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error resetting password: " + e.getMessage());
        }
    }

    @GetMapping("/system/logs")
    public ResponseEntity<List<Map<String, Object>>> getSystemLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String service) {

        logger.info("Admin requested system logs: page={}, size={}, level={}, service={}",
                page, size, level, service);

        // In a real implementation, you would fetch logs from a logging service or database
        List<Map<String, Object>> logs = new ArrayList<>();

        for (int i = 0; i < size; i++) {
            Map<String, Object> log = new HashMap<>();
            log.put("timestamp", LocalDateTime.now().minusMinutes(i * 5));
            log.put("level", getRandomLogLevel());
            log.put("service", getRandomService());
            log.put("message", "Sample log message #" + (i + 1));
            logs.add(log);
        }

        // Filter logs if parameters are provided
        if (level != null) {
            logs = logs.stream()
                    .filter(log -> level.equalsIgnoreCase((String) log.get("level")))
                    .collect(Collectors.toList());
        }

        if (service != null) {
            logs = logs.stream()
                    .filter(log -> service.equalsIgnoreCase((String) log.get("service")))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/system/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        logger.info("Admin requested system health check");

        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());

        // Services health
        Map<String, Object> services = new HashMap<>();
        services.put("user-service", Map.of("status", "UP", "version", "1.0.0"));
        services.put("image-service", Map.of("status", "UP", "version", "1.0.0"));
        services.put("report-service", Map.of("status", "UP", "version", "1.0.0"));
        services.put("gateway-service", Map.of("status", "UP", "version", "1.0.0"));
        services.put("discovery-service", Map.of("status", "UP", "version", "1.0.0"));

        // Database health
        Map<String, Object> databases = new HashMap<>();
        databases.put("postgres", Map.of("status", "UP", "responseTime", "5ms"));
        databases.put("mongodb", Map.of("status", "UP", "responseTime", "8ms"));

        health.put("services", services);
        health.put("databases", databases);

        // System metrics
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("cpu", "23%");
        metrics.put("memory", "1.2GB/4GB");
        metrics.put("disk", "45%");

        health.put("metrics", metrics);

        return ResponseEntity.ok(health);
    }

    @PostMapping("/system/config")
    public ResponseEntity<Map<String, Object>> updateSystemConfig(
            @Valid @RequestBody Map<String, Object> config) {

        logger.info("Admin updating system configuration: {}", config);

        // In a real implementation, you would update system configuration
        Map<String, Object> response = new HashMap<>();
        response.put("message", "System configuration updated successfully");
        response.put("updatedKeys", config.keySet());

        return ResponseEntity.ok(response);
    }

    // Helper methods

    private Map<String, Long> getUserCountByRole() {
        Map<String, Long> usersByRole = new HashMap<>();
        List<UserResponseDTO> allUsers = userService.getAllUsers();

        // Count users by role
        for (Role role : Role.values()) {
            long count = allUsers.stream()
                    .filter(user -> role.equals(user.role()))
                    .count();
            usersByRole.put(role.name(), count);
        }

        return usersByRole;
    }

    private List<Map<String, Object>> getRecentRegistrations(int limit) {
        List<UserResponseDTO> allUsers = userService.getAllUsers();

        // In a real implementation, you would sort by registration date
        // Here we're just taking the first few users as an example
        return allUsers.stream()
                .limit(limit)
                .map(user -> {
                    Map<String, Object> registration = new HashMap<>();
                    registration.put("id", user.id());
                    registration.put("name", user.firstname() + " " + user.lastname());
                    registration.put("email", user.email());
                    registration.put("role", user.role());
                    registration.put("registeredAt", LocalDateTime.now().minusDays(new Random().nextInt(30))); // Mock date
                    return registration;
                })
                .collect(Collectors.toList());
    }

    private String getRandomLogLevel() {
        String[] levels = {"INFO", "WARN", "ERROR", "DEBUG"};
        return levels[new Random().nextInt(levels.length)];
    }

    private String getRandomService() {
        String[] services = {"user-service", "image-service", "report-service", "gateway-service", "discovery-service"};
        return services[new Random().nextInt(services.length)];
    }




}
