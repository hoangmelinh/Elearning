package com.elearning.vocabulary;

import com.elearning.common.ApiResponse;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import com.elearning.vocabulary.dto.DocumentImportRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final DocumentParser documentParser;
    private final TableVocabExtractor tableVocabExtractor;
    private final com.elearning.ai.AiExtractionService aiExtractionService;

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Object>> importDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @ModelAttribute DocumentImportRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        String fileName = file != null ? file.getOriginalFilename() : "Raw Text";
        Document doc = documentService.createDocumentRecord(user, fileName, request.getLanguage());

        String textContent = "";

        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 5242880) { // 5MB guard
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                        .body(ApiResponse.error("File exceeds 5MB limit"));
            }
            try {
                textContent = documentParser.parse(file);
            } catch (Exception e) {
                log.warn("Failed to parse file: {}", e.getMessage());
            }
        } else if (request.getText_content() != null && !request.getText_content().isEmpty()) {
            textContent = request.getText_content();
        }

        final String finalContent = textContent;
        final boolean isTableData = textContent.startsWith("TABLE_TSV:");

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                if (isTableData) {
                    // Fast path: parse table directly, no AI needed
                    log.info("Detected table structure in document '{}', using direct parser.", fileName);
                    tableVocabExtractor.extractFromTsv(doc, finalContent, request.getDeck_name());
                } else {
                    // AI path: chunk and extract
                    log.info("No table detected in '{}', using AI chunked extraction.", fileName);
                    aiExtractionService.extractVocabularyFromDocument(doc, finalContent, request.getDeck_name());
                }
            } catch (Exception e) {
                log.error("Async extraction failed for document {}: {}", doc.getId(), e.getMessage(), e);
            }
        });

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("document_id", doc.getId());
        responseData.put("deck_name", request.getDeck_name());
        responseData.put("language", request.getLanguage());
        responseData.put("status", "processing");
        responseData.put("mode", isTableData ? "table_parser" : "ai_extraction");

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(responseData));
    }
}
