package com.elearning.listening;

import com.elearning.common.ContentLanguage;
import com.elearning.common.ExerciseSkillType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_type", nullable = false, columnDefinition = "exercise_skill_type")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ExerciseSkillType skillType; // "listening", "reading"

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private ContentLanguage language;

    @Column(length = 20)
    private String level; // "A1", "A2", "HSK1", etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id")
    private Video video;

    @Column(name = "passage_text", columnDefinition = "TEXT")
    private String passageText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
