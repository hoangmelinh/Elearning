package com.elearning.speaking;

import com.elearning.common.ContentLanguage;
import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "speaking_recordings")
@Getter
@Setter
public class SpeakingRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "content_language", nullable = false)
    private ContentLanguage language = ContentLanguage.en;

    @Column(name = "prompt_text", columnDefinition = "TEXT")
    private String promptText;

    @Column(name = "audio_url", nullable = false)
    private String audioUrl;

    @Column(name = "transcript_text", columnDefinition = "TEXT")
    private String transcriptText;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private ZonedDateTime expiresAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    /**
     * Tracks async pipeline: pending → transcribing → analyzing → completed / failed
     */
    @Column(name = "analysis_status", nullable = false, length = 20)
    private String analysisStatus = "pending";
}
