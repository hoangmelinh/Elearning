package com.elearning.listening.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UserAnswerRequest {
    private String questionId;
    private String selectedOptionId;
    private String answerText;
}
