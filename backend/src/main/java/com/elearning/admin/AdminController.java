package com.elearning.admin;

import com.elearning.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ── Dashboard Stats ──
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats fetched successfully", stats));
    }


    // ── Content (Decks) ──
    @GetMapping("/decks")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDecks() {
        return ResponseEntity.ok(ApiResponse.success("Decks fetched", adminService.getAllDecks()));
    }

    @DeleteMapping("/decks/{deckId}")
    public ResponseEntity<ApiResponse<Void>> deleteDeck(@PathVariable UUID deckId) {
        adminService.deleteDeck(deckId);
        return ResponseEntity.ok(ApiResponse.success("Deck deleted", null));
    }
}
