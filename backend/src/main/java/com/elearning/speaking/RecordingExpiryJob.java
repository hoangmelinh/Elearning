package com.elearning.speaking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecordingExpiryJob {

    private final SpeakingRecordingRepository recordingRepository;

    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM every day
    @Transactional
    public void markExpiredRecordingsAsDeleted() {
        ZonedDateTime now = ZonedDateTime.now();
        List<SpeakingRecording> expired = recordingRepository.findExpiredRecordings(now);
        
        for (SpeakingRecording recording : expired) {
            // In a real app, we might also explicitly call S3 to delete the file here
            // However, S3 Lifecycle rules are configured to automatically delete them after 15 days
            // So we just update the database flag
            recording.setDeleted(true);
        }
        
        if (!expired.isEmpty()) {
            recordingRepository.saveAll(expired);
            log.info("Marked {} expired speaking recordings as deleted.", expired.size());
        }
    }
}
