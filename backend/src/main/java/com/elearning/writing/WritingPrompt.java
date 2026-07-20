package com.elearning.writing;

import com.elearning.common.ContentLanguage;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "writing_prompts")
@Getter
@Setter
public class WritingPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "prompt_text", columnDefinition = "TEXT", nullable = false)
    private String promptText;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private ContentLanguage language;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type")
    private WritingTaskType taskType = WritingTaskType.IELTS_TASK_2;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "ai_reference_data", columnDefinition = "TEXT")
    private String aiReferenceData;

    @Column(length = 20)
    private String level; // "A1", "A2", "HSK1", etc.

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
