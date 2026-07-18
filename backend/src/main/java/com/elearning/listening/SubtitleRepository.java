package com.elearning.listening;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubtitleRepository extends JpaRepository<Subtitle, UUID> {
    List<Subtitle> findByVideoIdOrderByOrderIndexAsc(UUID videoId);
    List<Subtitle> findByVideoIdAndLanguageOrderByOrderIndexAsc(UUID videoId, String language);
    void deleteByVideoIdAndLanguage(UUID videoId, String language);
}
