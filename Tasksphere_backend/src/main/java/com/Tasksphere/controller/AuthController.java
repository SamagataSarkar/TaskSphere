package com.Tasksphere.controller;

import com.Tasksphere.dto.AuthResponse;
import com.Tasksphere.dto.LoginRequest;
import com.Tasksphere.dto.RegisterRequest;
import com.Tasksphere.dto.UserDTO;
import com.Tasksphere.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import com.Tasksphere.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Map;
import com.Tasksphere.dto.ForgotPasswordRequest;
import com.Tasksphere.dto.ResetPasswordRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RateLimitingService rateLimitingService;

    public AuthController(AuthService authService, RateLimitingService rateLimitingService) {
        this.authService = authService;
        this.rateLimitingService = rateLimitingService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        // Check Rate Limit First
        Bucket bucket = rateLimitingService.resolveBucket(request.getIdentifier());
        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Too many login attempts. Please try again in 15 minutes."));
        }

        // Process Login
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.requestPasswordReset(request.getIdentifier());
        } catch (IllegalArgumentException e) {
            // This prevents "Account Enumeration" attacks.
        }

        return ResponseEntity.ok(Map.of("message", "If an account exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password successfully reset."));
        } catch (IllegalArgumentException e) {
            // Returns a 400 Bad Request if the token is expired or invalid
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.PutMapping("/me")
    public org.springframework.http.ResponseEntity<com.Tasksphere.dto.UserDTO> updateProfile(
            @org.springframework.web.bind.annotation.RequestBody com.Tasksphere.dto.ProfileUpdateDTO updateDTO,
            org.springframework.security.core.Authentication authentication) {

        String email = authentication.getName();
        com.Tasksphere.dto.UserDTO updatedUser = authService.updateProfile(email, updateDTO);
        return org.springframework.http.ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(Map.of(
                "email", userDetails.getUsername(),
                "roles", userDetails.getAuthorities()
        ));
    }
}