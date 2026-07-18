package com.elearning.auth;

import com.elearning.auth.dto.AuthResponse;
import com.elearning.auth.dto.LoginRequest;
import com.elearning.auth.dto.RefreshRequest;
import com.elearning.auth.dto.RegisterRequest;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.user.UserRole;
import com.elearning.user.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long jwtExpiration;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        var user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        String phone = request.getPhone();
        user.setPhone(phone != null && phone.trim().isEmpty() ? null : phone);
        user.setRole(UserRole.student);
        user.setStatus(UserStatus.active);

        userRepository.save(user);

        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPasswordHash(), java.util.Collections.emptyList());

        var jwtToken = jwtUtil.generateToken(userDetails);
        var refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .access_token(jwtToken)
                .refresh_token(refreshToken)
                .expires_in(jwtExpiration / 1000)
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
                
        if (user.getStatus() == UserStatus.locked) {
            throw new IllegalArgumentException("Account is locked");
        }

        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPasswordHash(), java.util.Collections.emptyList());

        var jwtToken = jwtUtil.generateToken(userDetails);
        var refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .access_token(jwtToken)
                .refresh_token(refreshToken)
                .expires_in(jwtExpiration / 1000)
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse refresh(RefreshRequest request) {
        final String userEmail = jwtUtil.extractUsername(request.getRefresh_token());
        
        if (userEmail != null) {
            var user = userRepository.findByEmail(userEmail).orElseThrow();
            var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPasswordHash(), java.util.Collections.emptyList());
                
            if (jwtUtil.isTokenValid(request.getRefresh_token(), userDetails)) {
                var accessToken = jwtUtil.generateToken(userDetails);
                return AuthResponse.builder()
                        .access_token(accessToken)
                        .refresh_token(request.getRefresh_token())
                        .expires_in(jwtExpiration / 1000)
                        .role(user.getRole().name())
                        .build();
            }
        }
        throw new IllegalArgumentException("Invalid refresh token");
    }
}
