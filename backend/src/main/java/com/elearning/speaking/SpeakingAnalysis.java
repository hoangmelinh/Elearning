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

    @Column(name = "ielts_overall", precision = 3, scale = 1)
    private BigDecimal ieltsOverall;

    @Column(name = "ielts_fluency", precision = 3, scale = 1)
    private BigDecimal ieltsFluency;

    @Column(name = "ielts_lexical", precision = 3, scale = 1)
    private BigDecimal ieltsLexical;

    @Column(name = "ielts_grammar", precision = 3, scale = 1)
    private BigDecimal ieltsGrammar;

    @Column(name = "ielts_pronunciation", precision = 3, scale = 1)
    private BigDecimal ieltsPronunciation;

    @Column(name = "detailed_feedback", columnDefinition = "TEXT")
    private String detailedFeedback;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "grammar_errors", columnDefinition = "jsonb")
    private List<Map<String, Object>> grammarErrors;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "suggestions", columnDefinition = "jsonb")
    private List<Map<String, Object>> suggestions;
}
