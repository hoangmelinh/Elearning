package com.elearning.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpeakingAnalysisService {

    private final NvidiaAiClient aiClient;
    private final ObjectMapper objectMapper;

    public SpeakingAnalysisResult analyzeSpeech(String transcript, String promptText, String language) {
        String systemPrompt = "You are a professional speech analyst. Evaluate the user's speech transcript against the prompt text. "
            + "Return ONLY a raw JSON object without Markdown backticks. Format: "
            + "{\"pronunciationScore\": 85.5, "
            + "\"grammarErrors\": [{\"error_type\": \"grammar\", \"original\": \"\", \"corrected\": \"\", \"explanation\": \"\"}], "
            + "\"suggestions\": [{\"type\": \"fluency\", \"text\": \"\"}]}";
            
        String prompt = "Prompt Text: " + promptText + "\nUser Transcript: " + transcript + "\nLanguage: " + language;
        
        try {
            String aiResponse = aiClient.generateText(systemPrompt, prompt);
            
            if (aiResponse.startsWith("```json")) aiResponse = aiResponse.substring(7);
            if (aiResponse.endsWith("```")) aiResponse = aiResponse.substring(0, aiResponse.length() - 3);
            aiResponse = aiResponse.trim();
            
            Map<String, Object> aiResult = objectMapper.readValue(aiResponse, new TypeReference<Map<String, Object>>(){});
            
            SpeakingAnalysisResult result = new SpeakingAnalysisResult();
            if (aiResult.containsKey("pronunciationScore")) {
                result.setPronunciationScore(new BigDecimal(aiResult.get("pronunciationScore").toString()));
            } else {
                result.setPronunciationScore(new BigDecimal("0"));
            }
            
            result.setGrammarErrors((List<Map<String, Object>>) aiResult.get("grammarErrors"));
            result.setSuggestions((List<Map<String, Object>>) aiResult.get("suggestions"));
            
            return result;
        } catch (Exception e) {
            log.error("Speaking analysis failed", e);
            SpeakingAnalysisResult fallback = new SpeakingAnalysisResult();
            fallback.setPronunciationScore(new BigDecimal("0"));
            return fallback;
        }
    }

    public static class SpeakingAnalysisResult {
        private BigDecimal pronunciationScore;
        private List<Map<String, Object>> grammarErrors;
        private List<Map<String, Object>> suggestions;

        public BigDecimal getPronunciationScore() { return pronunciationScore; }
        public void setPronunciationScore(BigDecimal pronunciationScore) { this.pronunciationScore = pronunciationScore; }
        public List<Map<String, Object>> getGrammarErrors() { return grammarErrors; }
        public void setGrammarErrors(List<Map<String, Object>> grammarErrors) { this.grammarErrors = grammarErrors; }
        public List<Map<String, Object>> getSuggestions() { return suggestions; }
        public void setSuggestions(List<Map<String, Object>> suggestions) { this.suggestions = suggestions; }
    }
}
