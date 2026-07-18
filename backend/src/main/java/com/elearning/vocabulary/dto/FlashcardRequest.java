package com.elearning.vocabulary.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FlashcardRequest {
    @NotBlank
    private String term;
    private String phonetic;
    @NotBlank
    private String meaning_vi;
    private String example_sentence;
}
