package com.elearning.vocabulary;

import com.elearning.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final FlashcardDeckRepository deckRepository;

    public List<Flashcard> getCardsInDeck(UUID deckId) {
        return flashcardRepository.findByDeckId(deckId);
    }

    public Flashcard createCard(UUID deckId, User user, String term, String phonetic, String meaningVi, String example) {
        FlashcardDeck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new IllegalArgumentException("Deck not found"));

        if (!deck.getOwner().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not owner");
        }

        Flashcard card = new Flashcard();
        card.setDeck(deck);
        card.setTerm(term);
        card.setPhonetic(phonetic);
        card.setMeaningVi(meaningVi);
        card.setExampleSentence(example);
        card.setAiGenerated(false);
        card.setEdited(false);

        return flashcardRepository.save(card);
    }

    public Flashcard updateCard(UUID cardId, User user, String term, String phonetic, String meaningVi, String example) {
        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        if (!card.getDeck().getOwner().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not owner");
        }

        if (term != null) card.setTerm(term);
        if (phonetic != null) card.setPhonetic(phonetic);
        if (meaningVi != null) card.setMeaningVi(meaningVi);
        if (example != null) card.setExampleSentence(example);
        
        card.setEdited(true);

        return flashcardRepository.save(card);
    }

    public void deleteCard(UUID cardId, User user) {
        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        if (!card.getDeck().getOwner().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not owner");
        }

        flashcardRepository.delete(card);
    }
}
