package com.elearning.vocabulary;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_flashcard_progress")
@Getter
@Setter
public class UserFlashcardProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(nullable = false, length = 20)
    private String status = "new";

    @Column(name = "review_count", nullable = false)
    private int reviewCount = 0;

    @Column(name = "last_reviewed_at")
    private ZonedDateTime lastReviewedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
