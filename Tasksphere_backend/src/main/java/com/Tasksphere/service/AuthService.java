package com.Tasksphere.service;

import com.Tasksphere.dto.AuthResponse;
import com.Tasksphere.dto.LoginRequest;
import com.Tasksphere.dto.RegisterRequest;
import com.Tasksphere.dto.ProfileUpdateDTO;
import com.Tasksphere.dto.UserDTO;
import com.Tasksphere.model.Role;
import com.Tasksphere.model.User;
import com.Tasksphere.repository.PasswordResetTokenRepository;
import com.Tasksphere.repository.UserRepository;
import com.Tasksphere.security.JwtService;
import com.Tasksphere.util.Sanitizer;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    // FIXED: Added tokenRepository and emailService to the constructor
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmailOrUsername(request.getEmail(), request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Email or Username is already in use.");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.USER
        );

        user.setName(Sanitizer.sanitize(request.getName()));
        user.setAppUsername(request.getUsername());

        // Ensure tokenVersion is initialized to 0 for new users
        user.setTokenVersion(0);

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);
        return new AuthResponse(jwtToken);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrUsername(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email/username or password"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        request.getPassword()
                )
        );

        String jwtToken = jwtService.generateToken(user);
        return new AuthResponse(jwtToken);
    }

    @Transactional
    public UserDTO updateProfile(String email, ProfileUpdateDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 1. Update Name
        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            user.setName(Sanitizer.sanitize(dto.getName()));
        }

        // 2. Update Password (Secured)
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {

            // Require and verify the current password
            if (dto.getCurrentPassword() == null || dto.getCurrentPassword().trim().isEmpty()) {
                throw new IllegalArgumentException("Current password is required to set a new password.");
            }
            if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("The current password provided is incorrect.");
            }

            // Set new password and invalidate all existing active sessions
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
            user.setTokenVersion(user.getTokenVersion() != null ? user.getTokenVersion() + 1 : 1);
        }

        User updatedUser = userRepository.save(user);

        return new UserDTO(
                updatedUser.getId(),
                updatedUser.getEmail(),
                updatedUser.getName(),
                updatedUser.getRole().name()
        );
    }
    // ADDED: Generates the token and triggers the EmailService
    @Transactional
    public void requestPasswordReset(String identifier) {
        User user = userRepository.findByEmailOrUsername(identifier, identifier)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        tokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        com.Tasksphere.model.PasswordResetToken resetToken =
                new com.Tasksphere.model.PasswordResetToken(token, user, 15);

        tokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    // ADDED: Validates the token, updates the password, and forces a logout
    @Transactional
    public void resetPassword(String token, String newPassword) {
        com.Tasksphere.model.PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or missing reset token"));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new IllegalArgumentException("This reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));

        // FORCED LOGOUT: Increment tokenVersion to invalidate all existing JWTs across all devices
        user.setTokenVersion(user.getTokenVersion() != null ? user.getTokenVersion() + 1 : 1);

        userRepository.save(user);

        // Immediately delete the token so it can never be used again
        tokenRepository.delete(resetToken);
    }
}
