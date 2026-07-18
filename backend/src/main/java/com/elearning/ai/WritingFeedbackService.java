package com.elearning.ai;

import com.elearning.writing.WritingFeedback;
import com.elearning.writing.WritingFeedbackRepository;
import com.elearning.writing.WritingSubmission;
import com.elearning.writing.WritingSubmissionRepository;
import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WritingFeedbackService {

    private final WritingFeedbackRepository feedbackRepository;
    private final WritingSubmissionRepository submissionRepository;
    private final NvidiaAiClient aiClient;
    private final ObjectMapper objectMapper;

    @Async
    public void generateFeedback(WritingSubmission submission) {
        try {
            String systemPrompt = """
                You are an expert IELTS Writing examiner. Grade the user's essay strictly based on the official IELTS writing criteria for Task 2.

                Calculate scores for:
                - Task Response (TR)
                - Coherence and Cohesion (CC)
                - Lexical Resource (LR)
                - Grammatical Range and Accuracy (GRA)

                Scores must be on the 0 to 9.0 scale, in 0.5 increments. Calculate the overall band score by averaging the 4 criteria and rounding to the nearest half band (e.g., 6.75 -> 7.0, 6.25 -> 6.5).

                STRICT CRITERIA & GUARDRAILS FOR EVALUATION:
                1. GRAMMAR ACCURACY: Only report GENUINE grammatical, syntactical, or punctuation errors in "grammar_errors". 
                   - DO NOT flag natively correct idioms or prepositions (e.g., "at the expense of" is 100% correct).
                   - DO NOT flag correct collective nouns or subject-verb agreement (e.g., "youth communicate" is correct).
                   - If the essay has NO grammar errors, "grammar_errors" MUST be an empty array [].

                2. LEXICAL RESOURCE: 
                   - DO NOT simplify advanced C1/C2 vocabulary (e.g., "lifeways", "homogenization", "community-centered") to basic words.
                   - Only suggest vocabulary changes in "vocabulary_suggestions" if a word is used incorrectly in context, OR to suggest a more formal/academic phrasing for informal expressions (e.g., changing "take a back seat" to "are relegated to the background").

                3. DISTINCTION: Never confuse stylistic preferences or academic tone enhancements with grammatical errors.

                Return ONLY a raw JSON object. DO NOT wrap in Markdown backticks (```json ... ```). 

                JSON Format:
                {
                  "taskResponseScore": 8.0,
                  "coherenceScore": 8.5,
                  "lexicalScore": 8.5,
                  "grammarScore": 8.5,
                  "overallScore": 8.5,
                  "grammar_errors": [
                    {
                      "original": "exact sentence or phrase with real error",
                      "corrected": "corrected version",
                      "explanation": "concise explanation of the grammar rule broken"
                    }
                  ],
                  "vocabulary_suggestions": [
                    {
                      "original": "word or phrase",
                      "suggestion": "academic alternative",
                      "explanation": "why this enhances academic tone or context precision"
                    }
                  ],
                  "general_comment": "Comprehensive evaluation covering TR, CC, LR, and GRA."
                }
                """;
            
            String prompt = "Essay topic: " + submission.getPrompt().getTitle() + "\n"
                          + "Essay content: " + submission.getSubmissionText();
                          
            String aiResponse = aiClient.generateText(systemPrompt, prompt);
            
            // Clean markdown block
            if (aiResponse.startsWith("```json")) aiResponse = aiResponse.substring(7);
            if (aiResponse.endsWith("```")) aiResponse = aiResponse.substring(0, aiResponse.length() - 3);
            aiResponse = aiResponse.trim();
            
            Map<String, Object> aiFeedback = objectMapper.readValue(aiResponse, new TypeReference<Map<String, Object>>(){});

            WritingFeedback feedback = new WritingFeedback();
            feedback.setSubmission(submission);
            
            feedback.setTaskResponseScore(aiFeedback.containsKey("taskResponseScore") ? ((Number) aiFeedback.get("taskResponseScore")).doubleValue() : 0.0);
            feedback.setCoherenceScore(aiFeedback.containsKey("coherenceScore") ? ((Number) aiFeedback.get("coherenceScore")).doubleValue() : 0.0);
            feedback.setLexicalScore(aiFeedback.containsKey("lexicalScore") ? ((Number) aiFeedback.get("lexicalScore")).doubleValue() : 0.0);
            feedback.setGrammarScore(aiFeedback.containsKey("grammarScore") ? ((Number) aiFeedback.get("grammarScore")).doubleValue() : 0.0);
            feedback.setOverallScore(aiFeedback.containsKey("overallScore") ? ((Number) aiFeedback.get("overallScore")).doubleValue() : 0.0);

            Map<String, Object> detailedFeedback = new HashMap<>();
            detailedFeedback.put("grammar_errors", aiFeedback.get("grammar_errors"));
            detailedFeedback.put("vocabulary_suggestions", aiFeedback.get("vocabulary_suggestions"));
            detailedFeedback.put("general_comment", aiFeedback.get("general_comment"));

            feedback.setDetailedFeedback(detailedFeedback);
            
            // Save feedback
            feedbackRepository.save(feedback);

            // Update submission status
            submission.setStatus("graded");
            submissionRepository.save(submission);

        } catch (Exception e) {
            log.error("Failed to generate writing feedback", e);
            submission.setStatus("failed");
            submissionRepository.save(submission);
        }
    }
}
