package com.pcd.authentication;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcd.Token.Token;
import com.pcd.Token.TokenRepository;
import com.pcd.Token.TokenType;
import com.pcd.configurations.JwtService;
import com.pcd.user.model.User;
import com.pcd.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository repository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ActivationTokenRepository activationTokenRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    @Value("${activation.url}")
    private String activationUrl;

    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .firstname(request.getFirstname())
                .lastname(request.getLastname())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(false)
                .build();
        var savedUser = repository.save(user);
        String activationCode = generateAndSaveActivationToken(savedUser);
        String confirmationUrl;
        if (activationUrl.contains("?")) {
            confirmationUrl = activationUrl + "&token=" + activationCode;
        } else {
            confirmationUrl = activationUrl + "?token=" + activationCode;
        }

        String fullName = user.getFirstname() + " " + user.getLastname();
        Map<String, String> emailData = new HashMap<>();
        emailData.put("to", user.getEmail());
        emailData.put("username", fullName);
        emailData.put("confirmationUrl", confirmationUrl);
        emailData.put("activationCode", activationCode);
        emailData.put("subject", "Account Activation");
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String message = objectMapper.writeValueAsString(emailData);
            kafkaTemplate.send("user-registration", message);
        } catch (Exception e) {
            e.printStackTrace();
            // Consider adding more robust error handling here
            // For example, log the error or notify an admin
        }
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        saveUserToken(savedUser, jwtToken);
        return AuthenticationResponse.builder()
                .id(savedUser.getId())
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .role(user.getRole() != null ? user.getRole().toString() : "USER")
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, jwtToken);
        return AuthenticationResponse.builder()
                .id(user.getId())
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .role(user.getRole() != null ? user.getRole().toString() : "USER")
                .build();
    }

    private void saveUserToken(User user, String jwtToken) {
        var token = Token.builder()
                .user(user)
                .token(jwtToken)
                .tokenType(TokenType.BEARER)
                .expired(false)
                .revoked(false)
                .build();
        tokenRepository.save(token);
    }

    private void revokeAllUserTokens(User user) {
        var validUserTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (validUserTokens.isEmpty())
            return;
        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validUserTokens);
    }

    public AuthenticationResponse refreshToken(HttpServletRequest request) {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid or missing Authorization header");
        }
        final String refreshToken = authHeader.substring(7);
        final String userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail == null) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        var user = this.repository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        var accessToken = jwtService.generateToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, accessToken);
        return AuthenticationResponse.builder()
                .id(user.getId())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole() != null ? user.getRole().toString() : "USER")
                .build();
    }

    private String generateActivationCode() {
        String characters = "0123456789";
        StringBuilder activationCode = new StringBuilder(6);
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 6; i++) {
            int randINT = random.nextInt(characters.length());
            activationCode.append(characters.charAt(randINT));
        }
        return activationCode.toString();
    }

    private String generateAndSaveActivationToken(User user) {
        String tokenId = generateActivationCode();
        LocalDateTime now = LocalDateTime.now();
        var token = ActivationToken.builder()
                .token(tokenId)
                .createdAt(now)
                .expires(now.plusMinutes(30))
                .user(user)
                .build();
        activationTokenRepository.save(token);
        return tokenId;
    }

    public void activateAccount(String token) {
        ActivationToken activationToken = activationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalStateException("Token not found"));
        if (LocalDateTime.now().isAfter(activationToken.getExpires())) {
            throw new IllegalStateException("Token has expired");
        }
        User user = activationToken.getUser();
        if (user.isEnabled()) {
            throw new IllegalStateException("Account already activated");
        }
        user.setActive(true);
        repository.save(user);
        activationToken.setValidatedAt(LocalDateTime.now());
        activationTokenRepository.save(activationToken);
    }

    public void resendActivationCode(String email) {
        // Find the user by email
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Check if the account is already activated
        if (user.isEnabled()) {
            throw new IllegalStateException("Account already activated");
        }

        // Generate and save a new activation token
        String activationCode = generateAndSaveActivationToken(user);

        // Prepare the confirmation URL
        String confirmationUrl;
        if (activationUrl.contains("?")) {
            confirmationUrl = activationUrl + "&token=" + activationCode;
        } else {
            confirmationUrl = activationUrl + "?token=" + activationCode;
        }

        // Prepare email data
        String fullName = user.getFirstname() + " " + user.getLastname();
        Map<String, String> emailData = new HashMap<>();
        emailData.put("to", user.getEmail());
        emailData.put("username", fullName);
        emailData.put("confirmationUrl", confirmationUrl);
        emailData.put("activationCode", activationCode);
        emailData.put("subject", "Account Activation");

        // Send the email data to Kafka
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String message = objectMapper.writeValueAsString(emailData);
            kafkaTemplate.send("user-registration", message);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to send activation email");
        }
    }
}