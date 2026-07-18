package com.elearning.listening;

import com.elearning.common.ContentLanguage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;

    public Page<Video> getAllVideos(Pageable pageable) {
        return videoRepository.findAll(pageable);
    }

    public Video getVideo(UUID id) {
        return videoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Video not found"));
    }

    public Video createVideo(String title, ContentLanguage language, String sourceType, String videoUrl, Integer duration) {
        Video video = new Video();
        video.setTitle(title);
        video.setLanguage(language);
        video.setSourceType(sourceType);
        video.setVideoUrl(videoUrl);
        video.setDurationSeconds(duration);
        return videoRepository.save(video);
    }
}
