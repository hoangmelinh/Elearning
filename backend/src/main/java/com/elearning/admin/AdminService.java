package com.elearning.admin;

import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.user.UserRole;
import com.elearning.user.UserStatus;
import com.elearning.vocabulary.FlashcardDeck;
import com.elearning.vocabulary.FlashcardDeckRepository;
import com.elearning.vocabulary.FlashcardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final FlashcardDeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;

    // ── Dashboard Stats ──
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.admin).count();
        long totalStudents = totalUsers - totalAdmins;
        long totalDecks = deckRepository.count();
        long totalFlashcards = flashcardRepository.count();

        stats.put("totalUsers", totalUsers);
        stats.put("totalStudents", totalStudents);
        stats.put("totalAdmins", totalAdmins);
        stats.put("totalDecks", totalDecks);
        stats.put("totalFlashcards", totalFlashcards);

        return stats;
    }

    // ── Users Management ──
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId().toString());
                    map.put("fullName", u.getFullName());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole().name());
                    map.put("status", u.getStatus().name());
                    map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
                    return map;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> updateUserStatus(UUID userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(UserStatus.valueOf(status));
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId().toString());
        result.put("status", user.getStatus().name());
        return result;
    }

    public void deleteUser(UUID userId) {
        userRepository.deleteById(userId);
    }

    // ── Content Management ──
    public List<Map<String, Object>> getAllDecks() {
        return deckRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(d -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId().toString());
                    map.put("name", d.getName());
                    map.put("isPublic", d.isPublic());
                    map.put("ownerName", d.getOwner() != null ? d.getOwner().getFullName() : "Unknown");
                    map.put("ownerEmail", d.getOwner() != null ? d.getOwner().getEmail() : "");
                    map.put("createdAt", d.getCreatedAt() != null ? d.getCreatedAt().toString() : null);
                    long cardCount = flashcardRepository.findByDeckId(d.getId()).size();
                    map.put("cardCount", cardCount);
                    return map;
                })
                .collect(Collectors.toList());
    }

    public void deleteDeck(UUID deckId) {
        deckRepository.deleteById(deckId);
    }
}
