package com.elearning.vocabulary;

import com.elearning.common.ContentLanguage;
import com.elearning.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardDeckService {

    private final FlashcardDeckRepository deckRepository;

    public Page<FlashcardDeck> getDecks(User user, String visibility, ContentLanguage language, Pageable pageable) {
        // Simplified logic, in reality we should add specs for language filter
        if ("own".equals(visibility)) {
            return deckRepository.findByOwnerId(user.getId(), pageable);
        } else if ("public".equals(visibility)) {
            return deckRepository.findByIsPublicTrue(pageable);
        } else {
            return deckRepository.findByOwnerIdOrIsPublicTrue(user.getId(), pageable);
        }
    }

    public FlashcardDeck createDeck(User owner, String name, ContentLanguage language, boolean isPublic) {
        FlashcardDeck deck = new FlashcardDeck();
        deck.setOwner(owner);
        deck.setName(name);
        deck.setLanguage(language);
        deck.setPublic(isPublic);
        return deckRepository.save(deck);
    }

    public FlashcardDeck updateDeck(UUID deckId, User user, String name, Boolean isPublic) {
        FlashcardDeck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new IllegalArgumentException("Deck not found"));

        if (!deck.getOwner().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not owner");
        }

        if (name != null) deck.setName(name);
        if (isPublic != null) deck.setPublic(isPublic);

        return deckRepository.save(deck);
    }

    public void deleteDeck(UUID deckId, User user) {
        FlashcardDeck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new IllegalArgumentException("Deck not found"));

        if (!deck.getOwner().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not owner");
        }

        deckRepository.delete(deck);
    }
}
