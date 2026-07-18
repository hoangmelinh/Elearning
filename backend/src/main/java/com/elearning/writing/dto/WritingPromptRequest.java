package com.elearning.writing.dto;

import com.elearning.common.ContentLanguage;
import lombok.Data;

@Data
public class WritingPromptRequest {
    private String title;
    private String promptText;
    private ContentLanguage language;
    private String level;
}
