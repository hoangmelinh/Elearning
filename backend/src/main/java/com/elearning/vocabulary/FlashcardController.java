package com.elearning.vocabulary;

import com.elearning.common.ApiResponse;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.vocabulary.dto.ProgressUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;
    private final UserFlashcardProgressService progressService;
    private final UserRepository userRepository;

    @PatchMapping("/{cardId}")
    public ResponseEntity<ApiResponse<Flashcard>> updateFlashcard(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID cardId,
            @RequestBody java.util.Map<String, String> updates
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        String term = updates.get("term");
        String phonetic = updates.get("phonetic");
        String meaningVi = updates.get("meaning_vi");
        String example = updates.get("example_sentence");
        
        Flashcard card = flashcardService.updateCard(cardId, user, term, phonetic, meaningVi, example);
        return ResponseEntity.ok(ApiResponse.success(card));
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> deleteFlashcard(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID cardId
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        flashcardService.deleteCard(cardId, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{cardId}/progress")
    public ResponseEntity<ApiResponse<UserFlashcardProgress>> updateProgress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID cardId,
            @RequestBody ProgressUpdateRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        UserFlashcardProgress progress = progressService.updateProgress(cardId, user, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(progress));
    }
}
