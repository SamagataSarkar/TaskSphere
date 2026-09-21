package com.Tasksphere.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String token)
    {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("TaskSphere - Password Reset Request");

        // Assuming your React app runs on port 5173
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;

        message.setText("You requested a password reset.\n\n" +
                "Click the link below to securely change your password:\n" +
                resetUrl + "\n\n" +
                "This link will expire in 15 minutes. If you did not request this, please ignore this email.");

        mailSender.send(message);
    }
    public void sendProjectInvitation(String toEmail, String projectName, String inviterEmail, String inviteLink) {
        org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("You've been invited to join a project on TaskSphere");
        message.setText("Hello,\n\n" +
                inviterEmail + " has invited you to collaborate on the project '" + projectName + "'.\n\n" +
                "Click the secure link below to accept the invitation and join the workspace:\n" +
                inviteLink + "\n\n" +
                "This link will expire in 7 days.\n\n" +
                "Best,\nThe TaskSphere Team");

        mailSender.send(message);
    }
}