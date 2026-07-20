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
        String systemPrompt = "You are an expert IELTS examiner. Evaluate the user's speech transcript against the provided prompt text. "
            + "Return ONLY a raw JSON object without Markdown backticks. Format: "
            + "{\"ieltsOverall\": 7.0, \"ieltsFluency\": 7.0, \"ieltsLexical\": 7.0, \"ieltsGrammar\": 7.0, \"ieltsPronunciation\": 7.0, "
            + "\"detailedFeedback\": \"Detailed examiner feedback on the performance...\", "
            + "\"pronunciationScore\": 85.5, "
            + "\"grammarErrors\": [{\"error_type\": \"grammar\", \"original\": \"\", \"corrected\": \"\", \"explanation\": \"\"}], "
            + "\"suggestions\": [{\"type\": \"fluency\", \"text\": \"\"}]}";
            
        String prompt = "Prompt Text: " + promptText + "\nUser Transcript: " + transcript + "\nLanguage: " + language;
        
        try {
            String aiResponse = aiClient.generateText(systemPrompt, prompt);
            
            int startIndex = aiResponse.indexOf('{');
            int endIndex = aiResponse.lastIndexOf('}');
            if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
                aiResponse = aiResponse.substring(startIndex, endIndex + 1);
            } else {
                throw new RuntimeException("No JSON object found in response: " + aiResponse);
            }
            aiResponse = aiResponse.trim();
            
            Map<String, Object> aiResult = objectMapper.readValue(aiResponse, new TypeReference<Map<String, Object>>(){});
            
            SpeakingAnalysisResult result = new SpeakingAnalysisResult();
            
            if (aiResult.containsKey("ieltsOverall")) result.setIeltsOverall(new BigDecimal(aiResult.get("ieltsOverall").toString()));
            if (aiResult.containsKey("ieltsFluency")) result.setIeltsFluency(new BigDecimal(aiResult.get("ieltsFluency").toString()));
            if (aiResult.containsKey("ieltsLexical")) result.setIeltsLexical(new BigDecimal(aiResult.get("ieltsLexical").toString()));
            if (aiResult.containsKey("ieltsGrammar")) result.setIeltsGrammar(new BigDecimal(aiResult.get("ieltsGrammar").toString()));
            if (aiResult.containsKey("ieltsPronunciation")) result.setIeltsPronunciation(new BigDecimal(aiResult.get("ieltsPronunciation").toString()));
            if (aiResult.containsKey("detailedFeedback")) result.setDetailedFeedback(aiResult.get("detailedFeedback").toString());
            
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
            try {
                java.nio.file.Files.writeString(
                    java.nio.file.Path.of("e:/website_elearning/backend/ai-debug.log"),
                    "Error in AI analysis: " + e.getMessage() + "\n" + java.util.Arrays.toString(e.getStackTrace())
                );
            } catch (Exception ignored) {}

            SpeakingAnalysisResult fallback = new SpeakingAnalysisResult();
            fallback.setPronunciationScore(new BigDecimal("0"));
            return fallback;
        }
    }

    public static class SpeakingAnalysisResult {
        private BigDecimal ieltsOverall;
        private BigDecimal ieltsFluency;
        private BigDecimal ieltsLexical;
        private BigDecimal ieltsGrammar;
        private BigDecimal ieltsPronunciation;
        private String detailedFeedback;
        private BigDecimal pronunciationScore;
        private List<Map<String, Object>> grammarErrors;
        private List<Map<String, Object>> suggestions;

        public BigDecimal getIeltsOverall() { return ieltsOverall; }
        public void setIeltsOverall(BigDecimal ieltsOverall) { this.ieltsOverall = ieltsOverall; }
        public BigDecimal getIeltsFluency() { return ieltsFluency; }
        public void setIeltsFluency(BigDecimal ieltsFluency) { this.ieltsFluency = ieltsFluency; }
        public BigDecimal getIeltsLexical() { return ieltsLexical; }
        public void setIeltsLexical(BigDecimal ieltsLexical) { this.ieltsLexical = ieltsLexical; }
        public BigDecimal getIeltsGrammar() { return ieltsGrammar; }
        public void setIeltsGrammar(BigDecimal ieltsGrammar) { this.ieltsGrammar = ieltsGrammar; }
        public BigDecimal getIeltsPronunciation() { return ieltsPronunciation; }
        public void setIeltsPronunciation(BigDecimal ieltsPronunciation) { this.ieltsPronunciation = ieltsPronunciation; }
        public String getDetailedFeedback() { return detailedFeedback; }
        public void setDetailedFeedback(String detailedFeedback) { this.detailedFeedback = detailedFeedback; }
        public BigDecimal getPronunciationScore() { return pronunciationScore; }
        public void setPronunciationScore(BigDecimal pronunciationScore) { this.pronunciationScore = pronunciationScore; }
        public List<Map<String, Object>> getGrammarErrors() { return grammarErrors; }
        public void setGrammarErrors(List<Map<String, Object>> grammarErrors) { this.grammarErrors = grammarErrors; }
        public List<Map<String, Object>> getSuggestions() { return suggestions; }
        public void setSuggestions(List<Map<String, Object>> suggestions) { this.suggestions = suggestions; }
    }
}
