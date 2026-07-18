package com.elearning.listening;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAttemptRepository extends JpaRepository<UserAttempt, UUID> {
    List<UserAttempt> findByUserIdAndExerciseIdOrderByStartedAtDesc(UUID userId, UUID exerciseId);
    org.springframework.data.domain.Page<UserAttempt> findByUserId(UUID userId, org.springframework.data.domain.Pageable pageable);
    List<UserAttempt> findByExerciseId(UUID exerciseId);
}
