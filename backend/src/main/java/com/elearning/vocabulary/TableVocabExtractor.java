package com.elearning.vocabulary;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Parses TABLE_TSV formatted content (output from DocumentParser when a .docx table is detected)
 * and creates Flashcards directly without using AI.
 *
 * Expected TSV format per row: term [TAB] phonetic [TAB] meaning_vi
 * If only 2 columns: term [TAB] meaning_vi
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TableVocabExtractor {

    private final FlashcardDeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final com.elearning.vocabulary.DocumentRepository documentRepository;

    public void extractFromTsv(Document document, String tsvContent, String deckName) {
        FlashcardDeck deck = new FlashcardDeck();
        deck.setOwner(document.getUser());
        deck.setSourceDocument(document);
        deck.setName(deckName != null ? deckName : document.getFileName() + " Deck");
        deck.setLanguage(document.getLanguage());
        deck.setPublic(false);
        deckRepository.save(deck);

        // Strip the TABLE_TSV: prefix
        String data = tsvContent.replace("TABLE_TSV:", "").trim();
        String[] rows = data.split("\\r?\\n");

        int count = 0;
        for (String row : rows) {
            if (row.isBlank()) continue;
            String[] cols = row.split("\t");

            if (cols.length == 0) continue;

            int startIdx = 0;
            if (cols.length >= 3) {
                String firstColClean = cols[0].trim().toLowerCase().replaceAll("[.\\s:]", "");
                boolean isIndexCol = firstColClean.matches("\\d+") || 
                                     firstColClean.equals("stt") || 
                                     firstColClean.equals("no") || 
                                     firstColClean.equals("id") || 
                                     firstColClean.equals("index");
                if (isIndexCol) {
                    startIdx = 1;
                }
            }

            int activeLength = cols.length - startIdx;
            if (activeLength <= 0) continue;

            String term = cols[startIdx].trim();
            if (term.isEmpty()) continue;

            String phonetic = null;
            String meaningVi = "";

            if (activeLength == 1) {
                meaningVi = term;
            } else if (activeLength == 2) {
                // Could be term | meaning or term | phonetic — heuristic: if it contains / or [ it's phonetic
                String col1 = cols[startIdx + 1].trim();
                if (col1.startsWith("/") || col1.startsWith("[")) {
                    phonetic = col1;
                } else {
                    meaningVi = col1;
                }
            } else {
                // term | phonetic | meaning
                phonetic = cols[startIdx + 1].trim();
                meaningVi = cols[startIdx + 2].trim();
            }

            Flashcard card = new Flashcard();
            card.setDeck(deck);
            card.setTerm(term);
            card.setPhonetic(phonetic == null || phonetic.isEmpty() ? null : phonetic);
            card.setMeaningVi(meaningVi.isEmpty() ? term : meaningVi);
            card.setAiGenerated(false);
            card.setEdited(false);
            flashcardRepository.save(card);
            count++;
        }

        document.setStatus("completed");
        documentRepository.save(document);
        log.info("Table extraction complete: {} flashcards saved to deck '{}'.", count, deck.getName());
    }
}
