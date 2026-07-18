package com.elearning.listening.dto;

import com.elearning.common.ContentLanguage;
import com.elearning.common.ExerciseSkillType;
import lombok.Data;

import java.util.List;

/**
 * Full exercise creation payload: exercise metadata + questions + options in one request.
 */
@Data
public class FullExerciseRequest {
    private String title;
    private ContentLanguage language;
    private String level;         // "A1", "B2", "HSK1", etc.
    private ExerciseSkillType skillType;     // "reading" or "listening"
    private String passageText;   // reading exercises only
    private String youtubeUrl;    // listening exercises only

    private List<QuestionPayload> questions;

    @Data
    public static class QuestionPayload {
        private String questionText;
        private String questionType;        // "multiple_choice" | "fill_blank"
        private String correctAnswerText;   // fill_blank only
        private int orderIndex;
        private List<OptionPayload> options; // multiple_choice only
    }

    @Data
    public static class OptionPayload {
        private String optionText;
        @com.fasterxml.jackson.annotation.JsonProperty("isCorrect")
        private boolean isCorrect;
    }
}
