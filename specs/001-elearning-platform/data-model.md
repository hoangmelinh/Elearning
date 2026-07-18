# Data Model: Bilingual E-Learning Platform

**Feature**: `001-elearning-platform` | **Phase**: 1 — Design | **Date**: 2026-07-16

**Source**: `docs/Schema` (canonical DDL) + `docs/Data Dictionary.md`

> This document describes entities, relationships, and validation rules in implementation-agnostic terms. For exact DDL, refer to `docs/Schema`.

---

## Entity Overview (19 tables)

```
users
 ├── password_reset_tokens          (1-n)
 ├── documents                      (1-n, uploaded_by)
 │    └── flashcard_decks           (n-1, source_document_id nullable)
 ├── flashcard_decks                (1-n, owner_id)
 │    └── flashcards                (1-n)
 │         └── user_flashcard_progress  (n-n with users)
 ├── matching_results               (1-n)
 ├── videos                         (1-n, created_by)
 │    ├── subtitles                 (1-n)
 │    └── exercises (listening)     (1-n, video_id)
 ├── exercises (reading)            (standalone, passage_text)
 │    ├── questions                 (1-n)
 │    │    └── answer_options       (1-n)
 │    └── user_attempts             (1-n)
 │         └── user_answers         (1-n)
 ├── speaking_recordings            (1-n)
 │    └── speaking_analysis         (1-1)
 ├── writing_submissions            (1-n)
 │    └── writing_feedback          (1-1)
 └── learning_progress              (1-1)

writing_prompts                     (standalone — no FK to users at prompt level)
 └── writing_submissions            (1-n, prompt_id)
```

---

## Enum Types

| Enum name | Values | Purpose |
|---|---|---|
| `user_role` | `student`, `admin` | Access control |
| `user_status` | `active`, `locked` | Account blocking |
| `content_language` | `en`, `zh` | Bilingual content tagging; extensible |
| `document_file_type` | `txt`, `csv`, `docx`, `text_paste` | Document import type |
| `flashcard_status` | `new`, `learning`, `mastered` | Per-user card progress |
| `video_source_type` | `youtube`, `upload` | Video origin |
| `exercise_skill_type` | `listening`, `reading` | Shared exercise table discriminator |
| `question_type` | `multiple_choice`, `fill_blank` | Question format |
| `subtitle_language` | `source`, `vi` | `source` = original language (en/zh) |

---

## Entity Definitions

### users
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | Auto-generated |
| full_name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(150) | UNIQUE, NOT NULL | Login identifier |
| phone | VARCHAR(20) | UNIQUE, NULLABLE | Optional |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt |
| role | user_role | NOT NULL, DEFAULT 'student' | |
| status | user_status | NOT NULL, DEFAULT 'active' | |
| avatar_url | VARCHAR(255) | NULLABLE | S3 `avatars/` prefix |
| primary_learning_language | content_language | NULLABLE | Personalisation hint |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-updated via trigger |

### password_reset_tokens
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users, CASCADE DELETE | |
| otp_code | VARCHAR(10) | NOT NULL | 6-digit OTP |
| expires_at | TIMESTAMPTZ | NOT NULL | 10-minute TTL |
| is_used | BOOLEAN | NOT NULL, DEFAULT false | Prevents replay |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Business Rule**: OTP invalidated after first successful use OR after `expires_at`.

---

### documents
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| uploaded_by | UUID | FK → users, CASCADE DELETE | |
| file_name | VARCHAR(255) | NOT NULL | |
| file_type | document_file_type | NOT NULL | |
| file_url | VARCHAR(255) | NULLABLE | NULL for `text_paste` |
| file_size_kb | INT | NULLABLE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Validation**: `file_size_kb ≤ 5120` (5 MB); enforced at upload.

### flashcard_decks
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| name | VARCHAR(150) | NOT NULL | |
| language | content_language | NOT NULL | |
| owner_id | UUID | FK → users, CASCADE DELETE | |
| source_document_id | UUID | FK → documents, SET NULL | Nullable |
| is_public | BOOLEAN | NOT NULL, DEFAULT false | User-controlled |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-updated via trigger |

**Business Rule**: No admin approval for `is_public` toggle or any deck mutation.

### flashcards
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| deck_id | UUID | FK → flashcard_decks, CASCADE DELETE | |
| term | VARCHAR(255) | NOT NULL | English word or Hanzi |
| phonetic | VARCHAR(255) | NULLABLE | IPA (en) or Pinyin with tone marks (zh) |
| meaning_vi | VARCHAR(255) | NOT NULL | |
| example_sentence | TEXT | NULLABLE | |
| audio_url | VARCHAR(255) | NULLABLE | S3 pronunciation file |
| is_ai_generated | BOOLEAN | NOT NULL, DEFAULT false | |
| is_edited | BOOLEAN | NOT NULL, DEFAULT false | Set true on any user edit |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-updated via trigger |

### user_flashcard_progress
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users, CASCADE DELETE | |
| flashcard_id | UUID | FK → flashcards, CASCADE DELETE | |
| status | flashcard_status | NOT NULL, DEFAULT 'new' | |
| review_count | INT | NOT NULL, DEFAULT 0 | |
| last_reviewed_at | TIMESTAMPTZ | NULLABLE | |
| — | — | UNIQUE(user_id, flashcard_id) | One progress row per user per card |

### matching_results
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users, CASCADE DELETE | |
| deck_id | UUID | FK → flashcard_decks, CASCADE DELETE | |
| score | INT | NOT NULL | Correct pairs / total |
| time_taken_seconds | INT | NOT NULL | |
| completed_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### videos
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| title | VARCHAR(255) | NOT NULL | |
| language | content_language | NOT NULL | |
| source_type | video_source_type | NOT NULL | |
| video_url | VARCHAR(255) | NOT NULL | S3 URL or YouTube embed link |
| duration_seconds | INT | NULLABLE | |
| created_by | UUID | FK → users, CASCADE DELETE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Validation**: If `source_type = 'upload'`, `video_url` must be an S3 key; file ≤ 100 MB.

### subtitles
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| video_id | UUID | FK → videos, CASCADE DELETE | |
| language | subtitle_language | NOT NULL | `source` = original; `vi` = Vietnamese |
| start_time_ms | INT | NOT NULL | Milliseconds from video start |
| end_time_ms | INT | NOT NULL | Must be > start_time_ms |
| text | TEXT | NOT NULL | CJK text stored in UTF-8 |
| order_index | INT | NOT NULL | For ordered retrieval |

### exercises
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| skill_type | exercise_skill_type | NOT NULL | Discriminator |
| title | VARCHAR(255) | NOT NULL | |
| video_id | UUID | FK → videos, CASCADE | NULL for reading |
| passage_text | TEXT | NULLABLE | NULL for listening |
| language | content_language | NOT NULL | |
| level | VARCHAR(20) | NULLABLE | CEFR for en; HSK 1-6 for zh |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraint** (CHECK): `(skill_type = 'listening' AND video_id IS NOT NULL) OR (skill_type = 'reading' AND passage_text IS NOT NULL)`

### questions
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| exercise_id | UUID | FK → exercises, CASCADE DELETE | |
| question_type | question_type | NOT NULL | |
| question_text | TEXT | NOT NULL | |
| correct_answer_text | VARCHAR(255) | NULLABLE | Used for `fill_blank` only |
| order_index | INT | NOT NULL | |

### answer_options
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| question_id | UUID | FK → questions, CASCADE DELETE | |
| option_text | VARCHAR(255) | NOT NULL | |
| is_correct | BOOLEAN | NOT NULL, DEFAULT false | |

**Note**: Only relevant for `question_type = 'multiple_choice'`.

### user_attempts
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users, CASCADE DELETE | |
| exercise_id | UUID | FK → exercises, CASCADE DELETE | |
| score | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| completed_at | TIMESTAMPTZ | NULLABLE | |

**Business Rule**: NO `UNIQUE(user_id, exercise_id)` — multiple attempts allowed; each generates a new row. NEVER update an existing row's score.

### user_answers
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| attempt_id | UUID | FK → user_attempts, CASCADE DELETE | |
| question_id | UUID | FK → questions, CASCADE DELETE | |
| selected_option_id | UUID | FK → answer_options, SET NULL | NULL for fill_blank |
| answer_text | VARCHAR(255) | NULLABLE | Used for fill_blank |
| is_correct | BOOLEAN | NOT NULL, DEFAULT false | |

---

### speaking_recordings
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users, CASCADE DELETE | |
| language | content_language | NOT NULL, DEFAULT 'en' | Which language the student practised |
| prompt_text | TEXT | NULLABLE | Can include Hanzi + Pinyin for zh |
| audio_url | VARCHAR(255) | NOT NULL | S3 `recordings/` key |
| transcript_text | TEXT | NULLABLE | STT output; preserved after audio deletion |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| expires_at | TIMESTAMPTZ | NOT NULL, DEFAULT now()+15 days | S3 Lifecycle anchor |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | True after S3 physical deletion |

**Index on** `(expires_at) WHERE is_deleted = false` for efficient lifecycle scanning.

### speaking_analysis
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| recording_id | UUID | FK → speaking_recordings, CASCADE DELETE, UNIQUE | 1-to-1 |
| pronunciation_score | DECIMAL(5,2) | NULLABLE | 0–100 |
| grammar_errors | JSONB | NULLABLE | Structured list of errors |
| suggestions | JSONB | NULLABLE | Improvement hints (incl. tone for zh) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**JSON schema for `grammar_errors`**:
```json
[
  {
    "error_type": "tense" | "word_order" | "tone" | ...,
    "original": "string",
    "corrected": "string",
    "explanation": "string"
  }
]
```

---

### writing_prompts
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | NOT NULL | May contain Hanzi for zh prompts |
| language | content_language | NOT NULL | |
| level | VARCHAR(20) | NULLABLE | CEFR / HSK |

**Note**: `writing_prompts` has no FK to `users`; it is admin-managed content.

### writing_submissions
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users, CASCADE DELETE | |
| prompt_id | UUID | FK → writing_prompts, CASCADE DELETE | |
| content | TEXT | NOT NULL | Student essay; UTF-8 (supports Hanzi) |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

### writing_feedback
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| submission_id | UUID | FK → writing_submissions, CASCADE DELETE, UNIQUE | 1-to-1 |
| grammar_score | DECIMAL(5,2) | NULLABLE | 0–100 |
| vocabulary_score | DECIMAL(5,2) | NULLABLE | 0–100 |
| overall_score | DECIMAL(5,2) | NULLABLE | 0–100 |
| detailed_feedback | JSONB | NULLABLE | AI narrative + error list |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### learning_progress
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users, CASCADE DELETE, UNIQUE | 1-to-1 |
| total_flashcards_mastered | INT | NOT NULL, DEFAULT 0 | Denormalized count |
| total_exercises_completed | INT | NOT NULL, DEFAULT 0 | Denormalized count |
| streak_days | INT | NOT NULL, DEFAULT 0 | Reset if last_activity_date gap > 1 day |
| last_activity_date | DATE | NULLABLE | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-updated via trigger |

---

## Relationship Summary

| Relationship | Cardinality | Join / Key |
|---|---|---|
| users → flashcard_decks | 1 → N | `owner_id` |
| users ↔ flashcards | N ↔ N | via `user_flashcard_progress` |
| flashcard_decks → flashcards | 1 → N | `deck_id` |
| flashcard_decks → documents | N → 1 | `source_document_id` (nullable) |
| videos → subtitles | 1 → N | `video_id` |
| videos → exercises | 1 → N | `video_id` (listening only) |
| exercises → questions | 1 → N | `exercise_id` |
| questions → answer_options | 1 → N | `question_id` (multiple_choice only) |
| users → user_attempts | 1 → N | `user_id` |
| user_attempts → user_answers | 1 → N | `attempt_id` |
| users → speaking_recordings | 1 → N | `user_id` |
| speaking_recordings → speaking_analysis | 1 → 1 | `recording_id` (UNIQUE) |
| users → writing_submissions | 1 → N | `user_id` |
| writing_submissions → writing_feedback | 1 → 1 | `submission_id` (UNIQUE) |
| users → learning_progress | 1 → 1 | `user_id` (UNIQUE) |

---

## Triggers

| Trigger | Table | Action |
|---|---|---|
| `trg_users_updated_at` | users | SET `updated_at = now()` BEFORE UPDATE |
| `trg_decks_updated_at` | flashcard_decks | SET `updated_at = now()` BEFORE UPDATE |
| `trg_flashcards_updated_at` | flashcards | SET `updated_at = now()` BEFORE UPDATE |
| `trg_progress_updated_at` | learning_progress | SET `updated_at = now()` BEFORE UPDATE |

All triggers use the shared `set_updated_at()` function defined in `docs/Schema`.
