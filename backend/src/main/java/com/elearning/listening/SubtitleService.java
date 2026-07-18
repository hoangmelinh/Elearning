package com.elearning.listening;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubtitleService {

    private final SubtitleRepository subtitleRepository;
    private final VideoRepository videoRepository;

    public List<Subtitle> getSubtitles(UUID videoId, String language) {
        if (language == null) {
            return subtitleRepository.findByVideoIdOrderByOrderIndexAsc(videoId);
        }
        return subtitleRepository.findByVideoIdAndLanguageOrderByOrderIndexAsc(videoId, language);
    }

    @Transactional
    public void importSubtitles(UUID videoId, String language, List<Subtitle> subtitles) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new IllegalArgumentException("Video not found"));

        // Clear existing for language
        subtitleRepository.deleteByVideoIdAndLanguage(videoId, language);

        for (int i = 0; i < subtitles.size(); i++) {
            Subtitle sub = subtitles.get(i);
            sub.setVideo(video);
            sub.setLanguage(language);
            sub.setOrderIndex(i);
        }
        
        subtitleRepository.saveAll(subtitles);
    }
}
