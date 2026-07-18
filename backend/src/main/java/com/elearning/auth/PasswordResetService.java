package com.elearning.auth;

import com.elearning.auth.dto.ForgotPasswordRequest;
import com.elearning.auth.dto.ResetPasswordRequest;
import com.elearning.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    // In-memory store for OTPs for demonstration purposes
    // In a real app, this should be in the DB or Redis with an expiration time
    private final Map<String, String> otpStorage = new HashMap<>();

    public void generateAndSendOtp(ForgotPasswordRequest request) {
        // Find user by email, but don't reveal if they exist
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            // Generate 6-digit OTP
            String otp = String.format("%06d", (int)(Math.random() * 1000000));
            otpStorage.put(request.getEmail(), otp);
            
            // Here you would integrate with an Email service or SMS
            log.info("OTP for {} is: {}", request.getEmail(), otp);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid request"));
                
        String storedOtp = otpStorage.get(request.getEmail());
        if (storedOtp == null || !storedOtp.equals(request.getOtp_code())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNew_password()));
        userRepository.save(user);
        
        // Invalidate OTP after use
        otpStorage.remove(request.getEmail());
    }
}
