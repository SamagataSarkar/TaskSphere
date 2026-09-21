package com.Tasksphere.controller;

import com.Tasksphere.dto.UserDTO;
import com.Tasksphere.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        return userRepository.findByEmail(userDetails.getUsername())
                .map(user -> new UserDTO(
                        user.getId(),
                        user.getEmail(),
                        user.getName(),
                        user.getRole().name()
                ))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(@RequestParam String q) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> results = userRepository.searchByNameOrEmail(q).stream()
                .limit(5)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName() != null ? u.getName() : "Unknown User",
                        "email", u.getEmail()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }
}