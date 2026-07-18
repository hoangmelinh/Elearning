package com.elearning.user;

import com.elearning.common.PagedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public Page<User> getAllUsers(String search, UserRole role, UserStatus status, Pageable pageable) {
        // Simplified for this scope. Ideally we'd use a JPA Specification for dynamic filtering
        return userRepository.findAll(pageable);
    }

    public User updateUserStatusOrRole(UUID userId, UserRole role, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (role != null) {
            // Prevent demoting the last admin if necessary
            user.setRole(role);
        }
        if (status != null) {
            user.setStatus(status);
        }

        return userRepository.save(user);
    }

    public User getUserProfile(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public void deleteUser(UUID userId) {
        userRepository.deleteById(userId);
    }
}
