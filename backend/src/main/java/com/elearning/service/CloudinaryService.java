package com.elearning.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        try {
            String originalFilename = file.getOriginalFilename();
            String publicId = UUID.randomUUID().toString() + "_" + originalFilename;

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", "elearning/writing_prompts"
            ));

            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new IOException("Could not upload image to Cloudinary: " + e.getMessage());
        }
    }
}
