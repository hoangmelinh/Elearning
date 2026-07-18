package com.elearning.listening;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, UUID> {
    java.util.List<UserAnswer> findByAttemptId(UUID attemptId);
}
