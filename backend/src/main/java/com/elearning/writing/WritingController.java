package com.elearning.writing;

import com.elearning.ai.WritingFeedbackService;
import com.elearning.common.ApiResponse;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.writing.dto.WritingPromptRequest;
import com.elearning.writing.dto.WritingSubmissionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/writing")
@RequiredArgsConstructor
public class WritingController {

    private final WritingPromptRepository promptRepository;
    private final WritingSubmissionRepository submissionRepository;
    private final WritingFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final WritingFeedbackService feedbackService;

    // --- Prompts ---

    @GetMapping("/prompts")
    public ResponseEntity<ApiResponse<Page<WritingPrompt>>> getPrompts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<WritingPrompt> prompts = promptRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success(prompts));
    }

    @GetMapping("/prompts/{id}")
    public ResponseEntity<ApiResponse<WritingPrompt>> getPrompt(@PathVariable UUID id) {
        WritingPrompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found"));
        return ResponseEntity.ok(ApiResponse.success(prompt));
    }

    @PostMapping("/prompts")
    public ResponseEntity<ApiResponse<WritingPrompt>> createPrompt(
            @RequestBody WritingPromptRequest request
    ) {
        // Should be admin-only
        WritingPrompt prompt = new WritingPrompt();
        prompt.setTitle(request.getTitle());
        prompt.setPromptText(request.getPromptText());
        prompt.setLanguage(request.getLanguage());
        prompt.setLevel(request.getLevel());
        
        if (request.getTaskType() != null) {
            prompt.setTaskType(request.getTaskType());
        }
        prompt.setImageUrl(request.getImageUrl());
        prompt.setAiReferenceData(request.getAiReferenceData());
        
        WritingPrompt saved = promptRepository.save(prompt);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Prompt created", saved));
    }

    @PutMapping("/prompts/{id}")
    public ResponseEntity<ApiResponse<WritingPrompt>> updatePrompt(
            @PathVariable UUID id,
            @RequestBody WritingPromptRequest request
    ) {
        WritingPrompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found"));
        
        prompt.setTitle(request.getTitle());
        prompt.setPromptText(request.getPromptText());
        prompt.setLanguage(request.getLanguage());
        prompt.setLevel(request.getLevel());
        
        if (request.getTaskType() != null) {
            prompt.setTaskType(request.getTaskType());
        }
        prompt.setImageUrl(request.getImageUrl());
        prompt.setAiReferenceData(request.getAiReferenceData());
        
        WritingPrompt saved = promptRepository.save(prompt);
        return ResponseEntity.ok(ApiResponse.success("Prompt updated", saved));
    }

    @DeleteMapping("/prompts/{id}")
    public ResponseEntity<ApiResponse<String>> deletePrompt(@PathVariable UUID id) {
        WritingPrompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found"));
        
        promptRepository.delete(prompt);
        return ResponseEntity.ok(ApiResponse.success("Prompt deleted", null));
    }

    // --- Submissions ---

    @PostMapping("/submissions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitEssay(
            @RequestBody WritingSubmissionRequest request,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        WritingPrompt prompt = promptRepository.findById(request.getPromptId())
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found"));

        WritingSubmission submission = new WritingSubmission();
        submission.setUser(user);
        submission.setPrompt(prompt);
        submission.setSubmissionText(request.getSubmissionText());
        submission.setStatus("pending");
        
        WritingSubmission saved = submissionRepository.save(submission);
        
        // Trigger async AI feedback generation
        feedbackService.generateFeedback(saved);
        
        Map<String, Object> response = new HashMap<>();
        response.put("submission_id", saved.getId());
        response.put("status", saved.getStatus());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Essay submitted for grading", response));
    }

    @GetMapping("/submissions/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSubmission(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        WritingSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
                
        if (!submission.getUser().getEmail().equals(authentication.getName())) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this submission");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("submission", submission);
        
        feedbackRepository.findBySubmissionId(submission.getId()).ifPresent(feedback -> {
            response.put("feedback", feedback);
        });
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/submissions")
    public ResponseEntity<ApiResponse<Page<WritingSubmission>>> getUserSubmissions(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        Page<WritingSubmission> submissions = submissionRepository.findByUserId(
            user.getId(), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt")));
            
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }
}
