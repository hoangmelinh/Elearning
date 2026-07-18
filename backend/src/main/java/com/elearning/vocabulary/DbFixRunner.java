package com.elearning.vocabulary;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DbFixRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            log.info("Fixing documents table (dropping obsolete columns)...");
            jdbcTemplate.execute("ALTER TABLE documents DROP COLUMN IF EXISTS uploaded_by CASCADE");
            jdbcTemplate.execute("ALTER TABLE documents DROP COLUMN IF EXISTS file_type CASCADE");
        } catch (Exception e) {
            log.warn("Could not drop obsolete columns in documents table: " + e.getMessage());
        }

        try {
            log.info("Altering documents language column to varchar...");
            jdbcTemplate.execute("ALTER TABLE documents ALTER COLUMN language TYPE varchar(255) USING CASE WHEN language::text='0' THEN 'en' WHEN language::text='1' THEN 'zh' ELSE language::text END");
        } catch (Exception e) {
            log.warn("Could not alter documents language column: " + e.getMessage());
        }

        try {
            log.info("Altering flashcard_decks language column to varchar...");
            jdbcTemplate.execute("ALTER TABLE flashcard_decks ALTER COLUMN language TYPE varchar(255) USING CASE WHEN language::text='0' THEN 'en' WHEN language::text='1' THEN 'zh' ELSE language::text END");
        } catch (Exception e) {
            log.warn("Could not alter flashcard_decks language column: " + e.getMessage());
        }

        try {
            log.info("Testing query on flashcard_decks...");
            jdbcTemplate.queryForList("SELECT * FROM flashcard_decks LIMIT 1");
            log.info("Query on flashcard_decks succeeded.");
        } catch (Exception e) {
            log.error("Query on flashcard_decks failed: ", e);
        }
    }
}
