package com.elearning.vocabulary;

import com.elearning.common.ContentLanguage;
import com.elearning.storage.S3Service;
import com.elearning.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final S3Service s3Service;
    // Assuming AiExtractionService will be called asynchronously or in a separate flow
    // private final AiExtractionService aiExtractionService;

    public Document createDocumentRecord(User user, String fileName, ContentLanguage language) {
        Document doc = new Document();
        doc.setUser(user);
        doc.setFileName(fileName);
        doc.setLanguage(language);
        doc.setStatus("pending_upload");
        return documentRepository.save(doc);
    }
    
    public String getUploadUrl(Document doc) {
        // Generate pre-signed URL for upload
        // Key format: documents/{userId}/{documentId}/{fileName}
        String key = "documents/" + doc.getUser().getId() + "/" + doc.getId() + "/" + doc.getFileName();
        doc.setFileUrl(key);
        documentRepository.save(doc);
        return s3Service.generatePresignedUploadUrl(key, "application/octet-stream", 5242880); // 5MB limit
    }
    
    public Document markAsUploaded(Document doc) {
        doc.setStatus("processing");
        return documentRepository.save(doc);
    }
    
    public void markAsFailed(Document doc) {
        doc.setStatus("failed");
        documentRepository.save(doc);
    }
    
    public void markAsCompleted(Document doc) {
        doc.setStatus("completed");
        documentRepository.save(doc);
    }
}
