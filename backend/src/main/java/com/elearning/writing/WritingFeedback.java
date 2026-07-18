package com.elearning.writing;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.Map;

@Entity
@Table(name = "writing_feedback")
@Getter
@Setter
public class WritingFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private WritingSubmission submission;

    @Column(name = "task_response_score")
    private Double taskResponseScore;

    @Column(name = "coherence_score")
    private Double coherenceScore;

    @Column(name = "lexical_score")
    private Double lexicalScore;

    @Column(name = "grammar_score")
    private Double grammarScore;

    @Column(name = "overall_score")
    private Double overallScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detailed_feedback", columnDefinition = "jsonb")
    private Map<String, Object> detailedFeedback;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
