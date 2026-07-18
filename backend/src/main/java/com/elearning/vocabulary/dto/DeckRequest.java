package com.elearning.vocabulary.dto;

import com.elearning.common.ContentLanguage;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeckRequest {
    @NotBlank
    private String name;
    
    @NotNull
    private ContentLanguage language;
    
    @JsonProperty("is_public")
    private boolean isPublic = false;
}
