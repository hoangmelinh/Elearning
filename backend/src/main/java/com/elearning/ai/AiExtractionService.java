package com.elearning.ai;

import com.elearning.vocabulary.Document;
import com.elearning.vocabulary.Flashcard;
import com.elearning.vocabulary.FlashcardDeck;
import com.elearning.vocabulary.FlashcardDeckRepository;
import com.elearning.vocabulary.FlashcardRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiExtractionService {

    private final FlashcardDeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final com.elearning.vocabulary.DocumentRepository documentRepository;
    private final NvidiaAiClient aiClient;
    private final ObjectMapper objectMapper;

    /** Max characters per AI chunk — larger = fewer API calls */
    private static final int CHUNK_SIZE = 6000;

    /**
     * Max parallel AI calls.
     * NVIDIA API allows concurrent requests; 6 is safe without rate-limit risk.
     */
    private static final int PARALLEL_WORKERS = 6;

    public void extractVocabularyFromDocument(Document document, String textContent, String deckName) {
        FlashcardDeck deck = new FlashcardDeck();
        deck.setOwner(document.getUser());
        deck.setSourceDocument(document);
        deck.setName(deckName != null ? deckName : document.getFileName() + " Deck");
        deck.setLanguage(document.getLanguage());
        deck.setPublic(false);
        deckRepository.save(deck);

        String systemPrompt = "You are an expert language teacher. Extract ALL vocabulary words from the text provided. " +
                "Return ONLY a raw JSON array with no markdown, no explanation. " +
                "Format: [{\"term\":\"word\",\"phonetic\":\"/pronunciation/\",\"meaningVi\":\"vietnamese meaning\",\"exampleSentence\":\"example sentence\"}]. " +
                "If a word has no pronunciation, set phonetic to null. " +
                "Include every vocabulary entry you find — do not limit the count.";

        List<String> chunks = chunkText(textContent, CHUNK_SIZE);
        int totalChunks = chunks.size();
        log.info("Starting parallel AI extraction: {} chunks, {} workers.", totalChunks, PARALLEL_WORKERS);

        // Thread-safe map to collect deduplicated results: term.lowercase → card data
        ConcurrentHashMap<String, Map<String, String>> cardsByTerm = new ConcurrentHashMap<>();

        // Use fixed thread pool to limit parallelism
        ExecutorService executor = Executors.newFixedThreadPool(PARALLEL_WORKERS);

        try {
            List<CompletableFuture<Void>> futures = new ArrayList<>();

            for (int i = 0; i < chunks.size(); i++) {
                final int chunkIndex = i;
                final String chunk = chunks.get(i);

                CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                    String aiResponse = "";
                    try {
                        aiResponse = aiClient.generateText(systemPrompt, chunk);
                        List<Map<String, String>> extracted = parseJsonArray(aiResponse);

                        int added = 0;
                        for (Map<String, String> card : extracted) {
                            String term = card.get("term");
                            if (term != null && !term.isBlank()) {
                                cardsByTerm.putIfAbsent(term.trim().toLowerCase(), card);
                                added++;
                            }
                        }
                        log.info("Chunk {}/{}: extracted {} cards (running total: {}).",
                                chunkIndex + 1, totalChunks, added, cardsByTerm.size());

                    } catch (Exception e) {
                        log.warn("Chunk {}/{} failed. Error: {}", chunkIndex + 1, totalChunks, e.getMessage());
                        // Continue — other chunks are still processing
                    }
                }, executor);

                futures.add(future);
            }

            // Wait for all chunks to complete
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        } finally {
            executor.shutdown();
        }

        if (cardsByTerm.isEmpty()) {
            document.setStatus("failed");
            documentRepository.save(document);
            log.error("No vocabulary extracted from any chunk.");
            throw new RuntimeException("AI extraction yielded no vocabulary cards.");
        }

        // Persist all deduplicated cards
        for (Map<String, String> cardData : cardsByTerm.values()) {
            Flashcard card = new Flashcard();
            card.setDeck(deck);
            card.setTerm(cardData.get("term"));
            card.setPhonetic(cardData.get("phonetic"));
            card.setMeaningVi(cardData.get("meaningVi"));
            card.setExampleSentence(cardData.get("exampleSentence"));
            card.setAiGenerated(true);
            card.setEdited(false);
            flashcardRepository.save(card);
        }

        document.setStatus("completed");
        documentRepository.save(document);
        log.info("Extraction complete: {} unique flashcards saved to deck '{}'.", cardsByTerm.size(), deck.getName());
    }

    /**
     * Split text into chunks of at most {@code maxChars} characters,
     * breaking on newlines to avoid cutting words mid-sentence.
     */
    private List<String> chunkText(String text, int maxChars) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        String[] lines = text.split("\\r?\\n");
        StringBuilder current = new StringBuilder();

        for (String line : lines) {
            if (current.length() + line.length() + 1 > maxChars && current.length() > 0) {
                chunks.add(current.toString().trim());
                current = new StringBuilder();
            }
            if (line.length() > maxChars) {
                for (int i = 0; i < line.length(); i += maxChars) {
                    chunks.add(line.substring(i, Math.min(i + maxChars, line.length())));
                }
            } else {
                current.append(line).append("\n");
            }
        }
        if (current.length() > 0) {
            chunks.add(current.toString().trim());
        }
        return chunks;
    }

    /** Extract JSON array from raw AI response, stripping markdown fences if present. */
    private List<Map<String, String>> parseJsonArray(String aiResponse) throws Exception {
        int startIndex = aiResponse.indexOf('[');
        int endIndex = aiResponse.lastIndexOf(']');
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            aiResponse = aiResponse.substring(startIndex, endIndex + 1);
        } else {
            aiResponse = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
        }
        return objectMapper.readValue(aiResponse, new TypeReference<List<Map<String, String>>>() {});
    }
}
