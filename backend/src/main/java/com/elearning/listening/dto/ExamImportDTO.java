package com.elearning.listening.dto;

import com.elearning.common.ContentLanguage;
import com.elearning.common.ExerciseSkillType;
import lombok.Data;

import java.util.List;

/**
 * Payload for importing full IELTS, TOEIC, or HSK exam sets via JSON.
 */
@Data
public class ExamImportDTO {
    private String title;
    private ContentLanguage language;      // "en" or "zh"
    private String level;                 // "Band 6.5", "Target 650+", "HSK 4"
    private ExerciseSkillType skillType; // "reading" or "listening"
    private String passageText;           // Reading passage or transcript
    private String youtubeUrl;            // Optional video/audio URL for listening
    private String category;              // "IELTS", "TOEIC", "HSK"

    private List<QuestionImportItem> questions;

    @Data
    public static class QuestionImportItem {
        private String questionText;
        private String questionType;      // "multiple_choice", "fill_blank", "true_false_not_given"
        private String correctAnswerText; // fill_blank / true_false_not_given default
        private int orderIndex;
        private List<OptionImportItem> options;
    }

    @Data
    public static class OptionImportItem {
        private String optionText;
        @com.fasterxml.jackson.annotation.JsonProperty("isCorrect")
        private boolean isCorrect;
    }
}
