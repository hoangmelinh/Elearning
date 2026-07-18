package com.elearning.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Speech-to-Text service using NVIDIA Whisper API
 * Endpoint: https://integrate.api.nvidia.com/v1/audio/transcriptions
 * Model: openai/whisper-large-v3
 */
@Slf4j
@Service
public class SttService {

    // 10s connect, 90s read — Whisper on large audio files can take time
    private final RestTemplate restTemplate;

    public SttService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000); // 10 seconds
        factory.setReadTimeout(90_000);    // 90 seconds
        this.restTemplate = new RestTemplate(factory);
    }

    @Value("${nvidia.api.key}")
    private String apiKey;

    @Value("${nvidia.stt.url:https://integrate.api.nvidia.com/v1/audio/transcriptions}")
    private String sttUrl;

    @Value("${nvidia.stt.model:openai/whisper-large-v3}")
    private String sttModel;

    /**
     * Transcribe audio bytes using Nvidia Whisper.
     *
     * @param audioBytes  Raw audio bytes (webm/wav/mp3)
     * @param filename    Filename with extension so the API knows the format
     * @param language    ISO language code: "en" or "zh"
     * @return Transcript text
     */
    public String transcribeAudioBytes(byte[] audioBytes, String filename, String language) {
        if (apiKey == null || apiKey.isBlank() || "default-mock-key".equals(apiKey)) {
            log.warn("Nvidia API key not configured — returning mock transcript.");
            return "zh".equals(language) ? "你好，我叫小明。" : "Hello, my name is John.";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(apiKey);

            // Build multipart body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            body.add("file", audioResource);
            body.add("model", sttModel);

            // Map language code to ISO 639-1 for Whisper
            if (language != null && !language.isBlank()) {
                String whisperLang = "zh".equals(language) ? "zh" : "en";
                body.add("language", whisperLang);
            }

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

            log.info("Calling Nvidia Whisper STT: model={}, lang={}, bytes={}", sttModel, language, audioBytes.length);

            ResponseEntity<Map> response = restTemplate.postForEntity(sttUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object text = response.getBody().get("text");
                if (text != null) {
                    String transcript = text.toString().trim();
                    log.info("STT success: {} chars transcribed.", transcript.length());
                    return transcript;
                }
            }

            log.warn("STT response had no 'text' field: {}", response.getBody());
            return "";

        } catch (Exception e) {
            log.error("Nvidia Whisper STT call failed: {}", e.getMessage(), e);
            throw new RuntimeException("STT transcription failed: " + e.getMessage(), e);
        }
    }

    /**
     * Legacy method kept for backward compatibility (used when transcript already known).
     * @deprecated Use transcribeAudioBytes() instead.
     */
    @Deprecated
    public String transcribeAudio(String audioUrl, String language) {
        log.warn("Legacy transcribeAudio called for URL {}. No audio bytes available — returning empty.", audioUrl);
        return "";
    }
}
