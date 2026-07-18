package com.elearning.progress;

import com.elearning.common.ApiResponse;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final LearningProgressService progressService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<LearningProgress>> getProgress(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Log activity implicitly on load so we know they are active
        progressService.logActivity(user);
                
        LearningProgress progress = progressService.getProgress(user);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        Map<String, Object> history = progressService.getAggregatedHistory(user);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
