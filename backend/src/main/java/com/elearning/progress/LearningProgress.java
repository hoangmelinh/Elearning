package com.elearning.progress;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "learning_progress")
@Getter
@Setter
public class LearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_flashcards_mastered", nullable = false)
    private int totalFlashcardsMastered = 0;

    @Column(name = "total_exercises_completed", nullable = false)
    private int totalExercisesCompleted = 0;

    @Column(name = "streak_days", nullable = false)
    private int streakDays = 0;

    @Column(name = "last_activity_date")
    private ZonedDateTime lastActivityDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
