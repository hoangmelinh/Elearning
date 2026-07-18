# Quickstart & Validation Guide: Bilingual E-Learning Platform

**Feature**: `001-elearning-platform` | **Phase**: 1 | **Date**: 2026-07-16

This guide describes how to set up a local development environment and validate that each module works end-to-end. It references contracts and the data model — refer to `contracts/` and `data-model.md` for full API and entity details.

---

## Prerequisites

| Tool | Required Version | Purpose |
|---|---|---|
| Docker & Docker Compose | ≥ 24.x | Local PostgreSQL + backend container |
| Node.js | ≥ 20 LTS | Frontend dev server |
| Java | 21 (LTS) | Backend (if running without Docker) |
| Python | 3.11+ | Spec Kit scripts |
| AWS CLI | ≥ 2.x | S3 bucket setup |
| PostgreSQL client (`psql`) | ≥ 15 | Manual DB inspection |

---

## 1. Database Setup

```bash
# Start PostgreSQL via Docker
docker compose up -d db

# Connect and create database (use zh_CN.utf8 if available, fallback to en_US.utf8)
psql -h localhost -U postgres -c "CREATE DATABASE elearning_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;"

# Run the canonical DDL
psql -h localhost -U postgres -d elearning_db -f docs/Schema

# Verify tables
psql -h localhost -U postgres -d elearning_db -c "\dt"
# Expected: 19 tables listed
```

**Expected outcome**: All 19 tables created, 4 triggers installed, uuid-ossp extension enabled.

---

## 2. S3 Bucket Setup

```bash
# Create buckets (using LocalStack for local dev, or real AWS for staging)
aws s3api create-bucket --bucket elearning-local --region us-east-1

# Create prefix-simulated "folders" by uploading placeholder files
aws s3 cp /dev/null s3://elearning-local/documents/.keep
aws s3 cp /dev/null s3://elearning-local/videos/.keep
aws s3 cp /dev/null s3://elearning-local/recordings/.keep
aws s3 cp /dev/null s3://elearning-local/avatars/.keep
```

For production: configure S3 Lifecycle Rule on `recordings/` prefix:
- **Rule**: Expire objects after **15 days**
- **Scope**: Prefix `recordings/`

---

## 3. Backend Startup

```bash
# Set environment variables (or use .env file)
export DB_URL=jdbc:postgresql://localhost:5432/elearning_db
export DB_USER=postgres
export DB_PASS=postgres
export AWS_BUCKET=elearning-local
export AWS_REGION=us-east-1
export JWT_SECRET=<min-32-char-secret>
export OPENAI_API_KEY=<your-key>
export GEMINI_API_KEY=<your-key>

# Run backend
./mvnw spring-boot:run
# Or via Docker:
docker compose up backend
```

**Expected**: Spring Boot starts on port 8080; no DB connection errors; Flyway/DDL validation passes.

---

## 4. Frontend Startup

```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

**Expected**: React app loads; Noto Sans SC font renders Chinese characters without tofu boxes; no console errors.

---

## 5. Validation Scenarios

### 5.1 Authentication (AUTH-01, AUTH-02)

```
POST /api/auth/register
Body: { "full_name": "Test User", "email": "test@example.com", "password": "Pass1234!" }
Expected: 201 Created, { "access_token": "...", "refresh_token": "..." }

POST /api/auth/login
Body: { "email": "test@example.com", "password": "Pass1234!" }
Expected: 200 OK, tokens returned

POST /api/auth/forgot-password
Body: { "email": "test@example.com" }
Expected: 200 OK; OTP email sent; row in password_reset_tokens

DB check: SELECT * FROM password_reset_tokens WHERE is_used = false;
```

---

### 5.2 Vocabulary — Flashcard Import & Review (VOC-01 → VOC-04)

```
# Upload a document
POST /api/documents/import
Headers: Authorization: Bearer <token>
Body (multipart): file=<test.txt ≤ 5MB>, language=en
Expected: 201 Created; deck created; flashcards populated by AI

DB check:
SELECT f.term, f.phonetic, f.is_ai_generated FROM flashcards f
JOIN flashcard_decks d ON f.deck_id = d.id
WHERE d.owner_id = '<user_id>';

# Review a flashcard (mark mastered)
PATCH /api/flashcards/<card_id>/progress
Body: { "status": "mastered" }
Expected: 200 OK; user_flashcard_progress.status = 'mastered'

# Edit an AI-generated card
PATCH /api/flashcards/<card_id>
Body: { "meaning_vi": "updated meaning" }
Expected: 200 OK; is_edited = true in DB

# Matching exercise
POST /api/matching/<deck_id>/result
Body: { "score": 8, "time_taken_seconds": 45 }
Expected: 201 Created; row in matching_results
```

---

### 5.3 Listening — Video + Subtitles + Exercise (LIS-01, LIS-02)

```
# Admin creates a video
POST /api/videos
Headers: Authorization: Bearer <admin_token>
Body: { "title": "Test Video", "language": "en", "source_type": "youtube", "video_url": "https://youtube.com/..." }
Expected: 201 Created

# Add subtitles
POST /api/videos/<video_id>/subtitles/bulk
Body: [{ "language": "source", "start_time_ms": 0, "end_time_ms": 3000, "text": "Hello world", "order_index": 1 }]
Expected: 201 Created

# Create listening exercise
POST /api/exercises
Body: { "skill_type": "listening", "video_id": "<video_id>", "language": "en", "title": "Listen Test" }
Expected: 201 Created

# Submit attempt
POST /api/exercises/<exercise_id>/attempts
Headers: Authorization: Bearer <student_token>
Body: { "answers": [{ "question_id": "...", "selected_option_id": "..." }] }
Expected: 201 Created; score calculated; row in user_attempts

DB check:
SELECT COUNT(*) FROM user_attempts WHERE user_id = '<user_id>' AND exercise_id = '<ex_id>';
-- Re-submit and check count increases (history preserved)
```

---

### 5.4 Speaking — Recording & AI Analysis (SPEAK-01, SPEAK-02)

```
# Request pre-signed upload URL
POST /api/recordings/upload-url
Body: { "language": "zh", "file_size_bytes": 1500000 }
Expected: 200 OK; { "upload_url": "https://s3...", "recording_id": "..." }
# Note: file_size_bytes must be ≤ ~3MB (2 min @ reasonable bitrate)

# After client uploads to S3, trigger analysis
POST /api/recordings/<recording_id>/analyze
Expected: 202 Accepted (async); speaking_analysis row created within 5 seconds

DB check:
SELECT pronunciation_score, grammar_errors, suggestions
FROM speaking_analysis
WHERE recording_id = '<recording_id>';

# Verify expiry
SELECT expires_at, is_deleted FROM speaking_recordings WHERE id = '<recording_id>';
-- expires_at should be ~15 days from now; is_deleted = false
```

---

### 5.5 Writing — Prompt & AI Feedback (TEST-02)

```
# Admin creates a prompt
POST /api/writing-prompts
Body: { "title": "Describe your day", "description": "Write 100 words...", "language": "en", "level": "B1" }

# Student submits essay
POST /api/writing-submissions
Body: { "prompt_id": "<prompt_id>", "content": "Today I went to school..." }
Expected: 201 Created; writing_feedback populated within 5 seconds

DB check:
SELECT grammar_score, vocabulary_score, overall_score FROM writing_feedback
WHERE submission_id = '<submission_id>';
```

---

### 5.6 Progress Dashboard (TEST-03)

```
GET /api/progress
Headers: Authorization: Bearer <student_token>
Expected: 200 OK; { "total_flashcards_mastered": N, "total_exercises_completed": N, "streak_days": N, ... }

GET /api/exercises/<exercise_id>/history
Expected: list of all past attempts with scores (highest + most recent highlighted)
```

---

## 6. Chinese-Specific Validation

```bash
# Verify UTF-8 Hanzi storage
psql -d elearning_db -c "INSERT INTO flashcard_decks (name, language, owner_id) VALUES ('测试', 'zh', '<user_id>');"
psql -d elearning_db -c "SELECT name FROM flashcard_decks WHERE language = 'zh';"
# Expected: 测试 (no tofu boxes)

# Verify Pinyin with tone marks
psql -d elearning_db -c "INSERT INTO flashcards (deck_id, term, phonetic, meaning_vi) VALUES ('<deck_id>', '你好', 'nǐ hǎo', 'Xin chào');"
psql -d elearning_db -c "SELECT term, phonetic FROM flashcards WHERE term = '你好';"
# Expected: term=你好, phonetic=nǐ hǎo (tone marks preserved)
```

---

## 7. File Size Limit Validation

```bash
# Test oversized document (should fail at frontend before upload)
# Manually call backend with oversized file to verify backend guard:
curl -X POST http://localhost:8080/api/documents/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/6mb_file.txt" \
  -F "language=en"
# Expected: 413 Payload Too Large or 400 Bad Request with clear error message

# Test oversized video
curl -X POST http://localhost:8080/api/videos/upload-url \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"file_size_bytes": 105000000, "language": "en"}'
# Expected: 400 Bad Request — "File exceeds 100 MB limit"
```
