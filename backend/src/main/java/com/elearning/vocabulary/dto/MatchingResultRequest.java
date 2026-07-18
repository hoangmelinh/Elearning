package com.elearning.vocabulary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MatchingResultRequest {
    private int score;
    @JsonProperty("time_taken_seconds")
    private int timeTakenSeconds;
}
