package com.elearning.listening.dto;

import com.elearning.common.ContentLanguage;
import com.elearning.common.ExerciseSkillType;
import lombok.Data;

@Data
public class ExerciseRequest {
    private String title;
    private ContentLanguage language;
    private String level;
    private ExerciseSkillType skillType; // "reading" or "listening"
    private String passageText; // Used for reading
    private String videoId; // Used for listening
}
