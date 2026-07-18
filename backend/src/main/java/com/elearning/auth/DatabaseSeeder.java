package com.elearning.auth;

import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.user.UserRole;
import com.elearning.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@elearn.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            log.info("Seeding default admin user...");
            User admin = new User();
            admin.setFullName("Super Admin");
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(UserRole.admin);
            admin.setStatus(UserStatus.active);
            userRepository.save(admin);
            log.info("Default admin user created: {} / admin123", adminEmail);
        }
    }
}
