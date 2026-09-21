package com.Tasksphere.service;

import com.Tasksphere.dto.ProjectDTO;
import com.Tasksphere.model.*;
import com.Tasksphere.repository.ProjectInvitationRepository;
import com.Tasksphere.repository.ProjectMembershipRepository;
import com.Tasksphere.repository.ProjectRepository;
import com.Tasksphere.repository.UserRepository;
import com.Tasksphere.util.Sanitizer;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final ProjectInvitationRepository invitationRepository;
    private final EmailService emailService;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectMembershipRepository membershipRepository,
                          UserRepository userRepository,
                          ProjectInvitationRepository invitationRepository,EmailService emailService) {
        this.projectRepository = projectRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.emailService = emailService;
    }

    // --- HELPER METHOD: Safely gets the current user's email, clearing all 9 NPE warnings ---
    private String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("User is not authenticated.");
        }
        return auth.getName();
    }

    @Transactional
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        String email = getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String cleanName = Sanitizer.sanitize(projectDTO.getName());
        Project savedProject = projectRepository.save(new Project(cleanName));

        ProjectMembership membership = new ProjectMembership();
        membership.setProject(savedProject);
        membership.setUser(currentUser);
        membership.setRole(ProjectRole.OWNER);
        membershipRepository.save(membership);

        return new ProjectDTO(savedProject.getId(), savedProject.getName(), savedProject.isArchived());
    }

    @Transactional
    public void inviteMember(Long projectId, String newMemberEmail) {
        String requesterEmail = getCurrentUserEmail();

        ProjectMembership requesterMembership = membershipRepository.findByProjectIdAndUserEmail(projectId, requesterEmail)
                .orElseThrow(() -> new AccessDeniedException("You are not part of this project."));

        if (requesterMembership.getRole() != ProjectRole.OWNER) {
            throw new AccessDeniedException("Only the project OWNER can invite new members.");
        }

        // Fix: We execute the check to ensure the user exists, but we don't assign it to an unused variable
        userRepository.findByEmail(newMemberEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invited user does not exist."));

        if (membershipRepository.existsByProjectIdAndUserEmail(projectId, newMemberEmail)) {
            throw new IllegalArgumentException("User is already a member of this project.");
        }

        String token = UUID.randomUUID().toString();
        ProjectInvitation invitation = new ProjectInvitation(requesterMembership.getProject(), newMemberEmail, token);
        invitationRepository.save(invitation);

        // Construct the frontend URL
        String inviteLink = "http://localhost:5173/accept-invite?token=" + token;

        // Fire the email!
        emailService.sendProjectInvitation(
                newMemberEmail,
                requesterMembership.getProject().getName(),
                requesterEmail,
                inviteLink
        );
    }

    @Transactional
    public void acceptInvitation(String token) {
        String currentUserEmail = getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));

        ProjectInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired invitation token."));

        if (invitation.getStatus() != ProjectInvitation.InvitationStatus.PENDING) {
            throw new IllegalArgumentException("This invitation has already been used or revoked.");
        }
        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This invitation has expired. Please request a new one.");
        }
        if (!invitation.getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new IllegalArgumentException("This invitation was sent to a different email address.");
        }

        if (membershipRepository.existsByProjectIdAndUserEmail(invitation.getProject().getId(), currentUserEmail)) {
            invitation.setStatus(ProjectInvitation.InvitationStatus.ACCEPTED);
            invitationRepository.save(invitation);
            throw new IllegalArgumentException("You are already a member of this project!");
        }

        ProjectMembership newMembership = new ProjectMembership();
        newMembership.setProject(invitation.getProject());
        newMembership.setUser(currentUser);
        newMembership.setRole(ProjectRole.MEMBER);
        membershipRepository.save(newMembership);

        invitation.setStatus(ProjectInvitation.InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);
    }

    public List<ProjectDTO> getAllProjects() {
        String email = getCurrentUserEmail();
        return membershipRepository.findAll().stream()
                .filter(m -> m.getUser().getEmail().equals(email))
                .map(m -> new ProjectDTO(m.getProject().getId(), m.getProject().getName(), m.getProject().isArchived()))
                .collect(Collectors.toList());
    }

    public ProjectDTO getProjectById(Long id) {
        String email = getCurrentUserEmail();
        if (!membershipRepository.existsByProjectIdAndUserEmail(id, email)) {
            throw new AccessDeniedException("Access denied: Not a member of this project.");
        }
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        return new ProjectDTO(project.getId(), project.getName(), project.isArchived());
    }

    public List<Map<String, Object>> getProjectMembers(Long projectId) {
        String requesterEmail = getCurrentUserEmail();

        if (!membershipRepository.existsByProjectIdAndUserEmail(projectId, requesterEmail)) {
            throw new AccessDeniedException("Access denied: Not a member of this project.");
        }

        return membershipRepository.findAll().stream()
                .filter(m -> m.getProject().getId().equals(projectId))
                .map(m -> {
                    Map<String, Object> memberData = new java.util.HashMap<>();
                    memberData.put("id", m.getUser().getId());
                    memberData.put("email", m.getUser().getEmail());
                    memberData.put("role", m.getRole().name());
                    return memberData;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void archiveProject(Long id) {
        String email = getCurrentUserEmail();
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserEmail(id, email)
                .orElseThrow(() -> new AccessDeniedException("You are not part of this project."));

        if (membership.getRole() != ProjectRole.OWNER) {
            throw new AccessDeniedException("Only the project OWNER can archive the project.");
        }

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        project.setArchived(true);
    }

    @Transactional
    public void unarchiveProject(Long id) {
        String email = getCurrentUserEmail();
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserEmail(id, email)
                .orElseThrow(() -> new AccessDeniedException("You are not part of this project."));

        if (membership.getRole() != ProjectRole.OWNER) {
            throw new AccessDeniedException("Only the project OWNER can unarchive the project.");
        }

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        project.setArchived(false);
    }

    @Transactional
    public void deleteProject(Long id) {
        String email = getCurrentUserEmail();
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserEmail(id, email)
                .orElseThrow(() -> new AccessDeniedException("You are not part of this project."));

        if (membership.getRole() != ProjectRole.OWNER) {
            throw new AccessDeniedException("Only the project OWNER can delete the project.");
        }
        projectRepository.deleteById(id);
    }
}