package com.elearning.listening.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class AttemptSubmissionRequest {
    private List<UserAnswerRequest> answers;
}
