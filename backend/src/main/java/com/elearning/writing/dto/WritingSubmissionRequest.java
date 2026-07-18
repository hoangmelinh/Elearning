package com.elearning.writing.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class WritingSubmissionRequest {
    private UUID promptId;
    private String submissionText;
}
