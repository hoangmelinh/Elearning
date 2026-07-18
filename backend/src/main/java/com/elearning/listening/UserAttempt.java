package com.elearning.listening;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_attempts")
@Getter
@Setter
public class UserAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(nullable = false)
    private java.math.BigDecimal score;

    @Column(name = "started_at", nullable = false)
    private ZonedDateTime startedAt;

    @CreationTimestamp
    @Column(name = "completed_at", updatable = false)
    private ZonedDateTime completedAt;
}
