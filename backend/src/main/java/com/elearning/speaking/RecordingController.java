package com.elearning.speaking;

import com.elearning.ai.SpeakingAnalysisService;
import com.elearning.ai.SttService;
import com.elearning.common.ApiResponse;
import com.elearning.common.ContentLanguage;
import com.elearning.speaking.dto.RecordingResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import com.elearning.user.UserRepository;

@Slf4j
@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
public class RecordingController {

    private final SpeakingRecordingRepository recordingRepository;
    private final SpeakingAnalysisRepository analysisRepository;
    private final SttService sttService;
    private final SpeakingAnalysisService speakingAnalysisService;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────
    // NEW: Direct audio submit — Nvidia Whisper STT → AI analysis
    // ─────────────────────────────────────────────────────────────
    @PostMapping(value = "/submit", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitRecording(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam(value = "language", defaultValue = "en") String language,
            @RequestParam(value = "prompt_text", required = false) String promptText,
            Authentication authentication) {

        if (audioFile == null || audioFile.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Audio file is required"));
        }
        if (audioFile.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(ApiResponse.error("Audio file exceeds 10 MB limit"));
        }

        var user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Save initial record with status = pending
        SpeakingRecording recording = new SpeakingRecording();
        recording.setUser(user);
        recording.setLanguage(ContentLanguage.valueOf(language));
        recording.setPromptText(promptText);
        recording.setAudioUrl("local/" + UUID.randomUUID() + ".webm");
        recording.setExpiresAt(ZonedDateTime.now().plusDays(15));
        recording.setAnalysisStatus("pending");
        recording = recordingRepository.save(recording);

        // Read audio bytes BEFORE the async thread because MultipartFile is destroyed after HTTP request completes
        final byte[] audioBytes;
        final String filename = audioFile.getOriginalFilename() != null
                ? audioFile.getOriginalFilename() : "audio.webm";
        try {
            audioBytes = audioFile.getBytes();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to read audio file"));
        }

        final UUID recordingId = recording.getId();
        final String finalPromptText = promptText;

        CompletableFuture.runAsync(() -> {
            try {
                // Wait briefly to ensure the main thread has committed the transaction
                Thread.sleep(500);

                // Step 1: Whisper STT
                recordingRepository.updateStatus(recordingId, "transcribing");

                log.info("[{}] Starting Whisper STT ({} bytes)...", recordingId, audioBytes.length);
                String transcript = sttService.transcribeAudioBytes(audioBytes, filename, language);
                log.info("[{}] STT done: {} chars", recordingId, transcript.length());

                recordingRepository.updateStatusAndTranscript(recordingId, "analyzing", transcript);

                // Step 2: AI analysis
                log.info("[{}] Starting AI analysis...", recordingId);
                var aiResult = speakingAnalysisService.analyzeSpeech(transcript, finalPromptText, language);

                SpeakingAnalysis analysis = new SpeakingAnalysis();
                analysis.setRecording(recordingRepository.getReferenceById(recordingId));
                analysis.setPronunciationScore(aiResult.getPronunciationScore());
                analysis.setGrammarErrors(aiResult.getGrammarErrors());
                analysis.setSuggestions(aiResult.getSuggestions());
                analysisRepository.save(analysis);

                recordingRepository.updateStatus(recordingId, "completed");
                log.info("[{}] Analysis complete.", recordingId);

            } catch (Throwable e) {
                log.error("[{}] Pipeline failed: {}", recordingId, e.getMessage(), e);
                try {
                    recordingRepository.updateStatus(recordingId, "failed");
                } catch (Exception ex) {
                    log.error("Failed to mark recording as failed: {}", ex.getMessage());
                }
            }
        });

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Recording submitted",
                        Map.of("recording_id", recording.getId(), "status", "pending")));
    }

    // ─────────────────────────────────────────────────────────────
    // GET single recording (used for polling)
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RecordingResponse>> getRecording(
            @PathVariable UUID id,
            Authentication authentication) {

        SpeakingRecording recording = recordingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recording not found"));

        if (!recording.getUser().getEmail().equals(authentication.getName())) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized");
        }

        RecordingResponse.RecordingResponseBuilder builder = RecordingResponse.builder()
                .id(recording.getId())
                .language(recording.getLanguage())
                .promptText(recording.getPromptText())
                .audioUrl(recording.isDeleted() ? null : recording.getAudioUrl())
                .transcriptText(recording.getTranscriptText())
                .createdAt(recording.getCreatedAt())
                .expiresAt(recording.getExpiresAt())
                .isDeleted(recording.isDeleted())
                .analysisStatus(recording.getAnalysisStatus());

        analysisRepository.findByRecordingId(recording.getId()).ifPresent(analysis -> {
            builder.analysis(RecordingResponse.AnalysisDto.builder()
                    .pronunciationScore(analysis.getPronunciationScore())
                    .grammarErrors(analysis.getGrammarErrors())
                    .suggestions(analysis.getSuggestions())
                    .build());
        });

        return ResponseEntity.ok(ApiResponse.success("Recording found", builder.build()));
    }

    // ─────────────────────────────────────────────────────────────
    // GET list
    // ─────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<Page<RecordingResponse>>> getUserRecordings(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Page<SpeakingRecording> recordings = recordingRepository.findByUserId(
                user.getId(), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        Page<RecordingResponse> responses = recordings.map(recording -> {
            RecordingResponse.RecordingResponseBuilder builder = RecordingResponse.builder()
                    .id(recording.getId())
                    .language(recording.getLanguage())
                    .promptText(recording.getPromptText())
                    .audioUrl(recording.isDeleted() ? null : recording.getAudioUrl())
                    .transcriptText(recording.getTranscriptText())
                    .createdAt(recording.getCreatedAt())
                    .expiresAt(recording.getExpiresAt())
                    .isDeleted(recording.isDeleted())
                    .analysisStatus(recording.getAnalysisStatus());

            analysisRepository.findByRecordingId(recording.getId()).ifPresent(analysis -> {
                builder.analysis(RecordingResponse.AnalysisDto.builder()
                        .pronunciationScore(analysis.getPronunciationScore())
                        .grammarErrors(analysis.getGrammarErrors())
                        .suggestions(analysis.getSuggestions())
                        .build());
            });

            return builder.build();
        });

        return ResponseEntity.ok(ApiResponse.success("Success", responses));
    }

}
