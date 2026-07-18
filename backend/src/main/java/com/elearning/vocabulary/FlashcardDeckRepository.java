package com.elearning.vocabulary;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FlashcardDeckRepository extends JpaRepository<FlashcardDeck, UUID> {
    Page<FlashcardDeck> findByOwnerIdOrIsPublicTrue(UUID ownerId, Pageable pageable);
    Page<FlashcardDeck> findByOwnerId(UUID ownerId, Pageable pageable);
    Page<FlashcardDeck> findByIsPublicTrue(Pageable pageable);
}
