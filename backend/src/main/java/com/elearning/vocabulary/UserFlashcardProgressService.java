package com.elearning.vocabulary;

import com.elearning.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserFlashcardProgressService {

    private final UserFlashcardProgressRepository progressRepository;
    private final FlashcardRepository flashcardRepository;

    public UserFlashcardProgress updateProgress(UUID cardId, User user, String status) {
        Flashcard flashcard = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        UserFlashcardProgress progress = progressRepository.findByUserIdAndFlashcardId(user.getId(), cardId)
                .orElseGet(() -> {
                    UserFlashcardProgress newProgress = new UserFlashcardProgress();
                    newProgress.setUser(user);
                    newProgress.setFlashcard(flashcard);
                    newProgress.setReviewCount(0);
                    return newProgress;
                });

        progress.setStatus(status);
        progress.setReviewCount(progress.getReviewCount() + 1);
        progress.setLastReviewedAt(ZonedDateTime.now());

        return progressRepository.save(progress);
    }
}
