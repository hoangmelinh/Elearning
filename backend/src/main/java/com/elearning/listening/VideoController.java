package com.elearning.listening;

import com.elearning.common.ApiResponse;
import com.elearning.common.PagedResponse;
import com.elearning.listening.dto.VideoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;
    private final SubtitleService subtitleService;
    private final VideoRepository videoRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<Video>>> getVideos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<Video> videos = videoService.getAllVideos(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(videos)));
    }

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<ApiResponse<Video>> createVideo(@Valid @RequestBody VideoRequest request) {
        Video video = videoService.createVideo(
                request.getTitle(),
                request.getLanguage(),
                request.getSourceType(),
                request.getVideoUrl(),
                request.getDurationSeconds()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(video));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> deleteVideo(@PathVariable UUID id) {
        videoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/subtitles")
    public ResponseEntity<ApiResponse<List<Subtitle>>> getSubtitles(
            @PathVariable UUID id,
            @RequestParam(required = false) String language
    ) {
        List<Subtitle> subtitles = subtitleService.getSubtitles(id, language);
        return ResponseEntity.ok(ApiResponse.success(subtitles));
    }

    @PostMapping("/{id}/subtitles/bulk")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<ApiResponse<Void>> importSubtitles(
            @PathVariable UUID id,
            @RequestParam String language,
            @RequestBody List<Subtitle> subtitles
    ) {
        subtitleService.importSubtitles(id, language, subtitles);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Subtitles imported", null));
    }
}
