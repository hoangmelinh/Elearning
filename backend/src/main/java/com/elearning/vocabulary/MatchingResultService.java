package com.elearning.vocabulary;

import com.elearning.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchingResultService {

    private final MatchingResultRepository resultRepository;
    private final FlashcardDeckRepository deckRepository;

    public MatchingResult saveResult(UUID deckId, User user, int score, int timeTakenSeconds) {
        FlashcardDeck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new IllegalArgumentException("Deck not found"));

        MatchingResult result = new MatchingResult();
        result.setUser(user);
        result.setDeck(deck);
        result.setScore(score);
        result.setTimeTakenSeconds(timeTakenSeconds);

        return resultRepository.save(result);
    }
}
