package com.elearning.speaking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpeakingAnalysisRepository extends JpaRepository<SpeakingAnalysis, UUID> {
    Optional<SpeakingAnalysis> findByRecordingId(UUID recordingId);
}
