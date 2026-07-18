package com.elearning.writing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WritingFeedbackRepository extends JpaRepository<WritingFeedback, UUID> {
    Optional<WritingFeedback> findBySubmissionId(UUID submissionId);
}
