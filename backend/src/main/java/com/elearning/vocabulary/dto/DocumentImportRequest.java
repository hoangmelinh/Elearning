package com.elearning.vocabulary.dto;

import com.elearning.common.ContentLanguage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DocumentImportRequest {
    @NotNull
    private ContentLanguage language;
    private String deck_name;
    private String text_content;
}
