package com.elearning.writing;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "writing_submissions")
@Getter
@Setter
public class WritingSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    private WritingPrompt prompt;

    @Column(name = "submission_text", columnDefinition = "TEXT", nullable = false)
    private String submissionText;

    @Column(length = 50, nullable = false)
    private String status = "pending"; // "pending", "graded"

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private ZonedDateTime submittedAt;
}
