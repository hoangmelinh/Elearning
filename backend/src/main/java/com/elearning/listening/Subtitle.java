package com.elearning.listening;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "subtitles")
@Getter
@Setter
public class Subtitle {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    @Column(nullable = false, length = 10)
    private String language; // "source", "vi", etc.

    @Column(name = "start_time_ms", nullable = false)
    private int startTimeMs;

    @Column(name = "end_time_ms", nullable = false)
    private int endTimeMs;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;
}
