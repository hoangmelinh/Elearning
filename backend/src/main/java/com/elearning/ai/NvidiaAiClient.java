package com.elearning.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class NvidiaAiClient {

    private final RestTemplate restTemplate;
    
    @Value("${nvidia.api.key}")
    private String apiKey;
    
    @Value("${nvidia.api.url}")
    private String apiUrl;
    
    @Value("${nvidia.api.model}")
    private String model;

    public NvidiaAiClient() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000); // 10 seconds
        factory.setReadTimeout(60_000);    // 60 seconds
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Send a prompt to NVIDIA NIM API (OpenAI compatible payload)
     * and retrieve the generated text response.
     */
    public String generateText(String systemPrompt, String userPrompt) {
        if ("default-mock-key".equals(apiKey) || apiKey.isEmpty()) {
            throw new IllegalStateException("NVIDIA_API_KEY is not configured.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        
        List<Map<String, String>> messages = new ArrayList<>();
        
        if (systemPrompt != null && !systemPrompt.isEmpty()) {
            Map<String, String> sysMsg = new HashMap<>();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemPrompt);
            messages.add(sysMsg);
        }
        
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userPrompt);
        messages.add(userMsg);
        
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.0); // 0.0 for strict deterministic evaluation
        requestBody.put("max_tokens", 4096);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            throw new RuntimeException("Unexpected response format from NVIDIA API");
        } catch (Exception e) {
            throw new RuntimeException("Failed to call NVIDIA AI API: " + e.getMessage(), e);
        }
    }
}
