package com.elearning.speaking.dto;

import com.elearning.common.ContentLanguage;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class RecordingResponse {
    private UUID id;
    private ContentLanguage language;
    private String promptText;
    private String audioUrl;
    private String transcriptText;
    private ZonedDateTime createdAt;
    private ZonedDateTime expiresAt;
    private boolean isDeleted;
    private String analysisStatus;

    private AnalysisDto analysis;

    @Data
    @Builder
    public static class AnalysisDto {
        private BigDecimal pronunciationScore;
        private List<Map<String, Object>> grammarErrors;
        private List<Map<String, Object>> suggestions;
    }
}
