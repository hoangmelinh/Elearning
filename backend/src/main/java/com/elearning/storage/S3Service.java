package com.elearning.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

@Service
public class S3Service {

    @Value("${app.aws.s3.bucket}")
    private String bucketName;

    @Value("${app.aws.region}")
    private String regionString;

    private S3Presigner getPresigner() {
        return S3Presigner.builder()
                .region(Region.of(regionString))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
    
    private S3Client getClient() {
        return S3Client.builder()
                .region(Region.of(regionString))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    public String generatePresignedUploadUrl(String objectKey, String contentType, long maxFileSize) {
        try (S3Presigner presigner = getPresigner()) {
            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .putObjectRequest(b -> b.bucket(bucketName).key(objectKey).contentType(contentType))
                    .build();

            PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (Exception e) {
            // Fallback for local development when AWS credentials are not configured
            return "http://localhost:8081/api/documents/mock-upload/" + objectKey;
        }
    }

    public boolean validateFileSizeAfterUpload(String objectKey, long maxFileSize) {
        try (S3Client s3Client = getClient()) {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();
            HeadObjectResponse response = s3Client.headObject(headObjectRequest);
            return response.contentLength() <= maxFileSize;
        } catch (Exception e) {
            return false;
        }
    }
}
