package com.elearning.listening.dto;

import com.elearning.common.ContentLanguage;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VideoRequest {
    @NotBlank
    private String title;
    
    @NotNull
    private ContentLanguage language;
    
    @NotBlank
    @JsonProperty("source_type")
    private String sourceType; // "youtube" or "upload"
    
    @NotBlank
    @JsonProperty("video_url")
    private String videoUrl;
    
    @JsonProperty("duration_seconds")
    private Integer durationSeconds;
}
