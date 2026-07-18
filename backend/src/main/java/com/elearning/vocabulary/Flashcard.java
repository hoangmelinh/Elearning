package com.elearning.vocabulary;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "flashcards")
@Getter
@Setter
public class Flashcard {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    @JsonIgnore
    private FlashcardDeck deck;

    @Column(nullable = false, length = 100)
    private String term;

    @Column(length = 100)
    private String phonetic;

    @Column(name = "meaning_vi", nullable = false, columnDefinition = "TEXT")
    private String meaningVi;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "audio_url", length = 512)
    private String audioUrl;

    @Column(name = "is_ai_generated", nullable = false)
    private boolean isAiGenerated = false;

    @Column(name = "is_edited", nullable = false)
    private boolean isEdited = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
