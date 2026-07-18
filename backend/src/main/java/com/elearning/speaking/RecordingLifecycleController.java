package com.elearning.speaking;

import com.elearning.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/recordings")
@RequiredArgsConstructor
public class RecordingLifecycleController {

    private final SpeakingRecordingRepository recordingRepository;

    @PatchMapping("/{id}/mark-deleted")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> markDeleted(@PathVariable UUID id) {
        
        // In a real application, this internal endpoint would be protected by 
        // an internal service token or network rules to ensure only the Cron/Lambda can call it.
        
        recordingRepository.markAsDeleted(id);
        
        return ResponseEntity.ok(ApiResponse.success("Recording marked as deleted", 
                Map.of("recording_id", id, "is_deleted", true)));
    }
}
