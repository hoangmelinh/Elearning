package com.elearning.vocabulary;

import com.elearning.common.ApiResponse;
import com.elearning.common.ContentLanguage;
import com.elearning.common.PagedResponse;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.vocabulary.dto.DeckRequest;
import com.elearning.vocabulary.dto.FlashcardRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {

    private final FlashcardDeckService deckService;
    private final FlashcardService flashcardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<FlashcardDeck>>> getDecks(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "all") String visibility,
            @RequestParam(required = false) ContentLanguage language,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Page<FlashcardDeck> deckPage = deckService.getDecks(user, visibility, language, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(deckPage)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FlashcardDeck>> createDeck(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DeckRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        FlashcardDeck deck = deckService.createDeck(user, request.getName(), request.getLanguage(), request.isPublic());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(deck));
    }

    @PatchMapping("/{deckId}")
    public ResponseEntity<ApiResponse<FlashcardDeck>> updateDeck(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID deckId,
            @RequestBody java.util.Map<String, Object> updates
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        String name = (String) updates.get("name");
        Boolean isPublic = (Boolean) updates.get("is_public");
        FlashcardDeck deck = deckService.updateDeck(deckId, user, name, isPublic);
        return ResponseEntity.ok(ApiResponse.success(deck));
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> deleteDeck(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID deckId
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        deckService.deleteDeck(deckId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{deckId}/flashcards")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getFlashcards(
            @PathVariable UUID deckId
    ) {
        List<Flashcard> cards = flashcardService.getCardsInDeck(deckId);
        var response = new java.util.HashMap<String, Object>();
        response.put("deck_id", deckId);
        response.put("cards", cards);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{deckId}/flashcards")
    public ResponseEntity<ApiResponse<Flashcard>> createFlashcard(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID deckId,
            @Valid @RequestBody FlashcardRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Flashcard card = flashcardService.createCard(deckId, user, request.getTerm(), request.getPhonetic(), request.getMeaning_vi(), request.getExample_sentence());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(card));
    }
}
