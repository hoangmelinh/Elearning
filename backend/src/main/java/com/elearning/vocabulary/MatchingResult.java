package com.elearning.vocabulary;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "matching_results")
@Getter
@Setter
public class MatchingResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private FlashcardDeck deck;

    @Column(nullable = false)
    private int score;

    @Column(name = "time_taken_seconds", nullable = false)
    private int timeTakenSeconds;

    @CreationTimestamp
    @Column(name = "completed_at", updatable = false)
    private ZonedDateTime completedAt;
}
