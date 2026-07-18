package com.elearning.writing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WritingSubmissionRepository extends JpaRepository<WritingSubmission, UUID> {
    Page<WritingSubmission> findByUserId(UUID userId, Pageable pageable);
}
