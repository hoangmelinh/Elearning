package com.elearning.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Automatically updates PostgreSQL custom ENUM types on application startup.
 */
@Component
public class DatabaseSchemaInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaInitializer.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initSchema() {
        try {
            log.info("Checking PostgreSQL custom enum type 'exercise_skill_type'...");
            jdbcTemplate.execute("ALTER TYPE exercise_skill_type ADD VALUE IF NOT EXISTS 'speaking';");
            log.info("PostgreSQL enum 'exercise_skill_type' updated successfully with 'speaking'.");
        } catch (Exception e) {
            log.warn("Could not alter PostgreSQL enum 'exercise_skill_type': {}", e.getMessage());
        }

        try {
            log.info("Updating PostgreSQL check constraint 'chk_exercise_source' for speaking exercises...");
            jdbcTemplate.execute("ALTER TABLE exercises DROP CONSTRAINT IF EXISTS chk_exercise_source;");
            jdbcTemplate.execute("ALTER TABLE exercises ADD CONSTRAINT chk_exercise_source CHECK ((skill_type = 'reading' AND passage_text IS NOT NULL) OR (skill_type = 'listening' AND video_id IS NOT NULL) OR (skill_type = 'speaking'));");
            log.info("PostgreSQL check constraint 'chk_exercise_source' updated successfully.");
        } catch (Exception e) {
            log.warn("Could not update PostgreSQL check constraint 'chk_exercise_source': {}", e.getMessage());
        }
    }
}
