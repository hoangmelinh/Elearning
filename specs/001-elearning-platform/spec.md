# Feature Specification: Bilingual E-Learning Platform (English & Chinese)

**Feature Branch**: `001-elearning-platform`

**Created**: 2026-07-16

**Status**: Draft

**Source documents**: `docs/Project spec.MD`, `docs/Data Dictionary.md`, `docs/Schema`

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Student registers and studies vocabulary via Flashcard (Priority: P1)

A new student signs up with their email, receives access, and immediately begins learning vocabulary by importing a document (txt/csv/docx) or pasting text. The AI automatically extracts words, phonetics (IPA/Pinyin), Vietnamese meanings, and example sentences into a personal flashcard deck. The student reviews cards by flipping them, marks each as "Mastered" or "Needs Review", and optionally does a two-column matching exercise.

**Why this priority**: Vocabulary is the entry point for all other modules. Without it, no other learning can begin.

**Independent Test**: Can be tested by registering a new account, uploading a .txt file, verifying AI extraction, and completing a flashcard session — delivering vocabulary study value with zero dependency on other modules.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit a valid email + password, **Then** a student account is created and they are logged in.
2. **Given** a logged-in student, **When** they upload a ≤ 5 MB `.docx` file and select language `en`, **Then** AI extracts vocabulary into a new deck within the same session.
3. **Given** a deck with flashcards, **When** the student flips a card and marks it "Mastered", **Then** `user_flashcard_progress.status` becomes `mastered` and the review count increments.
4. **Given** a student-owned deck, **When** they edit a card's `meaning_vi` field, **Then** `flashcards.is_edited` becomes `true` and the updated value persists.
5. **Given** a deck, **When** the student starts a matching exercise (VOC-03), **Then** two columns are shown side-by-side and a score + time are recorded in `matching_results`.

---

### User Story 2 — Student watches a video and completes listening exercises (Priority: P2)

A student selects a video (YouTube embed or uploaded MP4) and watches it with bilingual subtitles synchronised to timestamps. They click on an unfamiliar word in the subtitle to get an instant definition. After watching, they attempt a listening comprehension exercise (multiple choice or fill-in-the-blank).

**Why this priority**: Listening is the second most critical skill and drives the need for the video + subtitle + exercise pipeline.

**Independent Test**: Can be tested by playing a video with synced subtitles, clicking a word, and completing one multiple-choice quiz — all without any other module.

**Acceptance Scenarios**:

1. **Given** a video with `source` and `vi` subtitle rows, **When** the student plays it, **Then** subtitles appear in sync within ±200 ms of the audio.
2. **Given** a subtitle word is clicked, **When** the lookup completes, **Then** a definition popup appears within 1 second.
3. **Given** a listening exercise, **When** the student submits answers, **Then** a score is recorded in `user_attempts` and individual answers stored in `user_answers`.

---

### User Story 3 — Student practises speaking and receives AI feedback (Priority: P3)

A student records up to 2 minutes of speech via their microphone. The platform transcribes the audio (STT) and an AI model analyses grammar errors, suggests corrections, and scores pronunciation. For Chinese, tone accuracy is included in the score. The audio file is automatically deleted from storage after 15 days, but the transcript and analysis remain permanently accessible.

**Why this priority**: Speaking is the most technically complex skill due to AI dependencies but is a core differentiator of the platform.

**Independent Test**: Can be tested end-to-end by recording 30 seconds of speech, verifying STT transcript, verifying AI feedback JSON, and checking that `expires_at` is set 15 days in the future.

**Acceptance Scenarios**:

1. **Given** a microphone is available, **When** the student starts recording, **Then** the UI shows a live waveform and enforces a 2-minute hard limit.
2. **Given** a completed recording, **When** AI analysis finishes, **Then** `speaking_analysis.pronunciation_score`, `grammar_errors`, and `suggestions` are populated.
3. **Given** a recording older than 15 days, **When** the S3 Lifecycle Rule executes, **Then** `speaking_recordings.is_deleted = true` and the transcript remains readable.

---

### User Story 4 — Student practises reading and writing (Priority: P3)

A student reads a passage (English or Chinese text) and answers multiple-choice comprehension questions. Separately, they respond to a writing prompt with a free-text essay; AI scores it on grammar, vocabulary, and overall quality.

**Why this priority**: Reading and writing complete the four-skills curriculum.

**Independent Test**: Can be tested by submitting answers to one reading exercise and one writing submission, checking scores are recorded.

**Acceptance Scenarios**:

1. **Given** a reading exercise, **When** the student submits answers, **Then** score is stored in `user_attempts`; student can re-attempt unlimited times.
2. **Given** a writing prompt, **When** the student submits an essay, **Then** `writing_feedback` is populated with `grammar_score`, `vocabulary_score`, `overall_score`, and `detailed_feedback`.

---

### User Story 5 — Admin manages users and content (Priority: P2)

An admin can view all user accounts (with search and pagination), lock/unlock accounts, and change roles. They can create public flashcard decks, upload videos with subtitles, create exercises, and manage writing prompts.

**Why this priority**: Without admin content management, students have no content to consume.

**Independent Test**: Can be tested by locking a student account (verifying JWT rejection) and creating a public deck — independent of all student-facing modules.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they lock a student account, **Then** that student's login returns an error and all API calls with their token are rejected.
2. **Given** an admin creates a public flashcard deck, **Then** `flashcard_decks.is_public = true` and all students can browse it.

---

### Edge Cases

- What happens when an uploaded file exceeds the size limit? → Frontend blocks immediately; backend returns a 413 error with a clear message.
- What happens when AI extraction fails mid-import? → Document record is retained; deck is created but empty with a status indicator; user can retry or manually add cards.
- What happens if a student's JWT expires during an exercise? → The client refreshes silently using the refresh token; if refresh also fails, the attempt is saved as incomplete.
- How does the system handle a video where `language = zh` but subtitles are uploaded in the wrong language? → No auto-correction; admin is responsible for accuracy; subtitles are tied to the video by `language` enum.
- What happens when `streak_days` is not updated on weekends if the student doesn't log in? → `last_activity_date` controls the streak; if today - `last_activity_date` > 1, streak resets to 0.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Users (AUTH / ADM)
- **FR-001**: System MUST allow users to register using email + password.
- **FR-002**: System MUST support password reset via OTP sent to registered email.
- **FR-003**: System MUST use JWT access tokens + refresh tokens for session management.
- **FR-004**: System MUST allow admins to list, search, paginate, lock/unlock, and re-assign roles for user accounts.

#### Vocabulary — Flashcard & Matching (VOC)
- **FR-010**: System MUST accept document uploads (`.txt`, `.csv`, `.docx`) ≤ 5 MB or raw text paste, and extract vocabulary via AI.
- **FR-011**: AI extraction MUST produce: original term, phonetic (IPA for `en`, Pinyin with tone marks for `zh`), Vietnamese meaning, example sentence.
- **FR-012**: Users MUST be able to create, rename, delete, and toggle public/private on their own decks without admin approval.
- **FR-013**: Flashcard review MUST support flip animation (front: term + phonetic; back: meaning + example + audio) and "Mastered" / "Needs Review" marking.
- **FR-014**: User edits to AI-generated flashcard fields MUST be saved in-place with `is_edited = true`.
- **FR-015**: Matching exercise MUST display two columns, support drag-or-click pairing, and record score + time in `matching_results`.

#### Listening (LIS)
- **FR-020**: System MUST support YouTube embed and direct S3 video upload (≤ 100 MB).
- **FR-021**: Subtitles MUST be stored per-line with millisecond timestamps (`start_time_ms`, `end_time_ms`) and rendered in sync during playback.
- **FR-022**: Students MUST be able to click any subtitle word to trigger an inline vocabulary lookup.
- **FR-023**: Listening exercises MUST support multiple-choice and fill-in-the-blank question types.

#### Speaking (SPEAK)
- **FR-030**: System MUST allow audio recording via browser microphone with a hard 2-minute limit.
- **FR-031**: Recorded audio MUST be uploaded to S3 (`recordings/` prefix); `expires_at` MUST be set to `now() + 15 days`.
- **FR-032**: AI analysis MUST produce: transcript text (STT), pronunciation score, grammar errors (JSON), and improvement suggestions (JSON).
- **FR-033**: For Chinese recordings, tone accuracy MUST be assessed (requires dedicated API or post-processing; Whisper alone is insufficient).
- **FR-034**: After S3 Lifecycle Rule deletes the audio file, `is_deleted = true` MUST be set; transcript and analysis remain accessible.

#### Reading & Writing (TEST)
- **FR-040**: Reading exercises MUST include a passage (plain text or Chinese characters) and support multiple-choice + fill-in-the-blank questions.
- **FR-041**: Writing exercises MUST include a prompt; student submits free-text; AI grades grammar, vocabulary, and overall quality.
- **FR-042**: All exercise attempts MUST be appended as new rows in `user_attempts` — no overwrite; unlimited re-attempts allowed.
- **FR-043**: Students MUST be able to view all historical attempts and scores.

#### Progress Tracking (TEST-03)
- **FR-050**: `learning_progress` MUST track: total flashcards mastered, total exercises completed, streak days, last activity date.
- **FR-051**: Dashboard MUST display at minimum the highest score and most recent score per exercise.

#### Non-Functional
- **FR-060**: Standard API response time MUST be < 500 ms (p95).
- **FR-061**: AI processing MUST complete within 5 seconds for STT + analysis.
- **FR-062**: All file size limits MUST be enforced at both frontend (client-side check before upload) and backend (server-side guard).
- **FR-063**: Passwords MUST be hashed with BCrypt; all API routes MUST require JWT Bearer Token.
- **FR-064**: Frontend MUST load a CJK-capable font (e.g., Noto Sans SC) to prevent tofu boxes on Chinese content.
- **FR-065**: The `content_language` enum MUST be designed for future extension (e.g., `ja`, `ko`) without schema restructuring.

### Key Entities *(include if feature involves data)*

- **User**: A person with a role (`student` | `admin`), email, hashed password, status, and optional avatar.
- **Flashcard Deck**: A named, language-tagged collection of flashcards owned by a user; may be public or private.
- **Flashcard**: A vocabulary card with term, phonetic, Vietnamese meaning, example sentence, audio URL, and AI/edit flags.
- **Video**: A learning video with language tag, source type (YouTube/upload), and duration.
- **Subtitle**: A single timed caption line belonging to a video, tagged as `source` or `vi`.
- **Exercise**: A structured quiz (listening or reading) linked to a video or passage.
- **Question**: A single quiz item (multiple choice or fill-in-the-blank) inside an exercise.
- **User Attempt**: One attempt by one user at one exercise; immutable after creation.
- **Speaking Recording**: An audio file reference with STT transcript, expiry timestamp, and deletion flag.
- **Speaking Analysis**: AI output (scores + structured JSON) linked 1-to-1 with a recording.
- **Writing Submission**: Student essay submitted against a writing prompt.
- **Writing Feedback**: AI-generated scores and structured feedback for one submission.
- **Learning Progress**: Aggregated stats (1-to-1 with User), updated after each activity.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can register, import a vocabulary document, and complete a flashcard review session within 5 minutes of first visit.
- **SC-002**: Subtitles are displayed within ±200 ms of the corresponding audio timestamp on 95% of playback events.
- **SC-003**: AI speech analysis results are returned within 5 seconds of recording submission for clips ≤ 2 minutes.
- **SC-004**: 100% of exercise attempts are preserved in history; re-attempting never overwrites a previous score.
- **SC-005**: Audio files older than 15 days are no longer playable, but transcripts and analysis scores remain visible.
- **SC-006**: All content modules (Flashcard, Listening, Speaking, Reading, Writing) function identically for both `en` and `zh` content.
- **SC-007**: No CJK character renders as a tofu box (□) on any supported browser.
- **SC-008**: File uploads exceeding size limits are blocked with a user-friendly error message before any data is sent to the server.

---

## Assumptions

- The platform targets a student audience of < 50 concurrent users during the initial phase; AWS Free Tier is sufficient.
- Mobile support is required (responsive layout), but native iOS/Android apps are out of scope.
- Admin content creation (videos, exercises, writing prompts) is done via the same web UI, not a separate CMS.
- The AI extraction for flashcards will use Gemini API or GPT-4o-mini; latency for AI calls is acceptable given the async import flow.
- For Chinese tone scoring, an additional API (beyond Whisper) will be selected during the Speaking module sprint; this is a known open item.
- The learning progress dashboard displays: **highest score** and **most recent score** per exercise (business rule not yet fully confirmed — see `§6 Business Rules #7` in project spec).
- Deployment target for v1 is Option B: Render/Koyeb + Supabase/Neon + Vercel (lower operational overhead for a small team).
- Database is initialized by running `docs/Schema` verbatim; agents MUST NOT regenerate the DDL.
