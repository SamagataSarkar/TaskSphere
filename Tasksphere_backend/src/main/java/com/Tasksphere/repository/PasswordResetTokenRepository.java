package com.Tasksphere.repository;

import com.Tasksphere.model.PasswordResetToken;
import com.Tasksphere.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    // Allows us to clear out old tokens if the user requests a new one
    void deleteByUser(User user);
}