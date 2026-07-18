package com.elearning.speaking;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "speaking_analysis")
@Getter
@Setter
public class SpeakingAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recording_id", nullable = false, unique = true)
    private SpeakingRecording recording;

    @Column(name = "pronunciation_score", precision = 5, scale = 2)
    private BigDecimal pronunciationScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "grammar_errors", columnDefinition = "jsonb")
    private List<Map<String, Object>> grammarErrors;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "suggestions", columnDefinition = "jsonb")
    private List<Map<String, Object>> suggestions;
}
