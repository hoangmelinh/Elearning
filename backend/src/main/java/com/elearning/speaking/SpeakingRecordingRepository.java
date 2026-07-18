package com.elearning.speaking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SpeakingRecordingRepository extends JpaRepository<SpeakingRecording, UUID> {
    Page<SpeakingRecording> findByUserId(UUID userId, Pageable pageable);
    
    @Query("SELECT r FROM SpeakingRecording r WHERE r.expiresAt < :now AND r.isDeleted = false")
    List<SpeakingRecording> findExpiredRecordings(ZonedDateTime now);
    
    @Modifying
    @Query("UPDATE SpeakingRecording r SET r.isDeleted = true WHERE r.id = :id")
    void markAsDeleted(UUID id);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE SpeakingRecording r SET r.analysisStatus = :status WHERE r.id = :id")
    void updateStatus(UUID id, String status);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE SpeakingRecording r SET r.analysisStatus = :status, r.transcriptText = :transcript WHERE r.id = :id")
    void updateStatusAndTranscript(UUID id, String status, String transcript);
}
