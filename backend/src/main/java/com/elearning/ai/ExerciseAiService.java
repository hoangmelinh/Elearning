package com.elearning.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExerciseAiService {

    private final NvidiaAiClient aiClient;
    private final ObjectMapper objectMapper;

    /**
     * Calls LLM to generate a full reading exercise based on topic, level, and language.
     * Expected return is a raw JSON string that maps to the frontend FullExerciseRequest.
     */
    public Map<String, Object> generateExercise(String topic, String level, String language) {
        String systemPrompt = "You are an expert language teacher and curriculum designer. "
            + "Generate a reading comprehension exercise based on the provided topic, CEFR level, and language. "
            + "Return ONLY a raw JSON object (without markdown backticks) matching this structure exactly:\n"
            + "{\n"
            + "  \"title\": \"A catchy title for the passage\",\n"
            + "  \"language\": \"en\" or \"zh\" (matching the requested language),\n"
            + "  \"level\": \"The CEFR level (e.g. B1)\",\n"
            + "  \"skillType\": \"reading\",\n"
            + "  \"passageText\": \"The reading passage content. Use paragraphs if necessary, separated by \\n\\n\",\n"
            + "  \"questions\": [\n"
            + "    {\n"
            + "      \"questionText\": \"The question text\",\n"
            + "      \"questionType\": \"multiple_choice\" or \"fill_blank\",\n"
            + "      \"correctAnswerText\": \"(Required ONLY for fill_blank) The exact text that should fill the blank\",\n"
            + "      \"orderIndex\": 1,\n"
            + "      \"options\": [\n"
            + "        { \"optionText\": \"Option 1\", \"isCorrect\": true },\n"
            + "        { \"optionText\": \"Option 2\", \"isCorrect\": false }\n"
            + "        // Must have exactly 4 options for multiple_choice\n"
            + "      ]\n"
            + "    }\n"
            + "  ]\n"
            + "}\n"
            + "Generate EXACTLY 5 questions (mix of multiple choice and fill in the blanks) suitable for the requested level.";

        String prompt = "Topic: " + topic + "\nLevel: " + level + "\nLanguage: " + language;
        
        try {
            // Assume aiClient.generateText(systemPrompt, prompt) calls the text model
            String aiResponse = aiClient.generateText(systemPrompt, prompt);
            
            // Cleanup markdown if present
            if (aiResponse.startsWith("```json")) aiResponse = aiResponse.substring(7);
            if (aiResponse.endsWith("```")) aiResponse = aiResponse.substring(0, aiResponse.length() - 3);
            aiResponse = aiResponse.trim();
            
            return objectMapper.readValue(aiResponse, new TypeReference<Map<String, Object>>(){});
        } catch (Exception e) {
            log.error("AI exercise generation failed", e);
            throw new RuntimeException("Failed to generate exercise via AI: " + e.getMessage());
        }
    }
}
