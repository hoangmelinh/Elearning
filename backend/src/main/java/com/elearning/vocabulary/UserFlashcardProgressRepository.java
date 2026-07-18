package com.elearning.vocabulary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFlashcardProgressRepository extends JpaRepository<UserFlashcardProgress, UUID> {
    Optional<UserFlashcardProgress> findByUserIdAndFlashcardId(UUID userId, UUID flashcardId);
}
