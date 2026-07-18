package com.elearning.vocabulary;

import com.elearning.common.ApiResponse;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.vocabulary.dto.MatchingResultRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingResultService matchingResultService;
    private final FlashcardService flashcardService;
    private final UserRepository userRepository;

    @GetMapping("/decks/{deckId}/matching")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getMatchingExercise(
            @PathVariable UUID deckId,
            @RequestParam(defaultValue = "10") int count
    ) {
        List<Flashcard> allCards = flashcardService.getCardsInDeck(deckId);
        
        // Shuffle and limit to requested count
        Collections.shuffle(allCards);
        List<Flashcard> selectedCards = allCards.stream().limit(count).collect(Collectors.toList());
        
        // Map to pairs
        List<java.util.Map<String, Object>> pairs = selectedCards.stream().map(card -> {
            var pair = new java.util.HashMap<String, Object>();
            pair.put("card_id", card.getId());
            pair.put("term", card.getTerm());
            pair.put("meaning_vi", card.getMeaningVi());
            return pair;
        }).collect(Collectors.toList());

        var response = new java.util.HashMap<String, Object>();
        response.put("deck_id", deckId);
        response.put("pairs", pairs);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/matching/{deckId}/result")
    public ResponseEntity<ApiResponse<MatchingResult>> submitResult(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID deckId,
            @RequestBody MatchingResultRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        MatchingResult result = matchingResultService.saveResult(deckId, user, request.getScore(), request.getTimeTakenSeconds());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }
}
