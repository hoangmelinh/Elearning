# Tasks: Bilingual E-Learning Platform (English & Chinese)

**Input**: `specs/001-elearning-platform/` — spec.md, plan.md, data-model.md, research.md, contracts/

**Format**: `- [ ] [TaskID] [P?] [Story?] Description — file path`
- **[P]** = parallelizable (different files, no dependency on incomplete tasks)
- **[US#]** = maps to User Story in spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding, tooling, environment — no user story work yet.

- [X] T001 Initialize Spring Boot 3.x project with Maven, Java 21, Spring Security, Spring Data JPA, AWS SDK v2 — `backend/pom.xml`
- [X] T002 Initialize React 18 + TypeScript + Vite project with TailwindCSS, Axios, React Router v6 — `frontend/package.json`
- [X] T003 [P] Create Docker Compose file with PostgreSQL 15 + backend + frontend services — `docker-compose.yml`
- [X] T004 [P] Configure environment variable management (`.env.example`, `application.yml` profiles: dev/prod) — `backend/src/main/resources/application.yml`
- [X] T005 [P] Load Noto Sans SC font in frontend HTML shell to prevent CJK tofu boxes — `frontend/index.html`
- [X] T006 Run `docs/Schema` DDL against local PostgreSQL to create all 19 tables and triggers — `docs/Schema`

**Checkpoint**: `docker compose up` starts all services; `psql` shows 19 tables.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure MUST be complete before any user story begins.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Implement `Users` JPA entity and `UserRepository` — `backend/src/main/java/com/elearning/user/User.java`, `UserRepository.java`
- [X] T008 Implement BCrypt password encoding bean and JWT utility (sign, verify, extract claims) — `backend/src/main/java/com/elearning/auth/JwtUtil.java`
- [X] T009 Configure Spring Security filter chain: JWT Bearer Token filter, role-based route protection (`student`/`admin`) — `backend/src/main/java/com/elearning/auth/SecurityConfig.java`
- [X] T010 [P] Implement global exception handler returning structured JSON errors — `backend/src/main/java/com/elearning/common/GlobalExceptionHandler.java`
- [X] T011 [P] Implement `S3Service` for pre-signed URL generation and HeadObject file-size validation — `backend/src/main/java/com/elearning/storage/S3Service.java`
- [X] T012 [P] Create shared `ApiResponse<T>` wrapper and `PagedResponse<T>` DTO — `backend/src/main/java/com/elearning/common/ApiResponse.java`
- [X] T013 [P] Create Axios HTTP client with JWT interceptor (attach token, handle 401 refresh) — `frontend/src/services/httpClient.ts`

**Checkpoint**: A valid JWT can be generated; `S3Service` returns a pre-signed URL in tests; Spring Security returns 401 for unauthenticated calls.

---

## Phase 3: User Story 1 — Student registers and studies vocabulary (Priority: P1) 🎯 MVP

**Goal**: Registration → document import → AI flashcard extraction → card review → matching exercise.

**Independent Test**: Register a new account, upload a `.txt` file, verify AI-extracted cards, flip cards, mark one "Mastered", complete a matching exercise and see score saved.

### Auth sub-tasks (US1 dependency)

- [X] T014 [US1] Implement `POST /api/auth/register` — `backend/src/main/java/com/elearning/auth/AuthController.java`, `AuthService.java`
- [X] T015 [US1] Implement `POST /api/auth/login` and `POST /api/auth/refresh` — `backend/src/main/java/com/elearning/auth/AuthController.java`
- [X] T016 [US1] Implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` (OTP, `password_reset_tokens`) — `backend/src/main/java/com/elearning/auth/PasswordResetService.java`
- [X] T017 [US1] Build Register + Login pages with form validation — `frontend/src/pages/RegisterPage.tsx`, `LoginPage.tsx`
- [X] T018 [US1] Implement `useAuth` hook (store tokens, redirect on login/logout) — `frontend/src/hooks/useAuth.ts`

### Vocabulary — Backend

- [X] T019 [P] [US1] Create JPA entities: `Document`, `FlashcardDeck`, `Flashcard`, `UserFlashcardProgress`, `MatchingResult` — `backend/src/main/java/com/elearning/vocabulary/`
- [X] T020 [US1] Implement `DocumentService`: validate ≤ 5 MB, upload to S3 `documents/`, save `Document` row — `backend/src/main/java/com/elearning/vocabulary/DocumentService.java`
- [X] T021 [US1] Implement `AiExtractionService`: call Gemini/GPT-4o-mini with document text, parse response into `Flashcard` rows with `is_ai_generated = true` — `backend/src/main/java/com/elearning/ai/AiExtractionService.java`
- [X] T022 [US1] Implement `FlashcardDeckService`: CRUD for deck (create, rename, toggle `is_public`, delete) — `backend/src/main/java/com/elearning/vocabulary/FlashcardDeckService.java`
- [X] T023 [US1] Implement `FlashcardService`: CRUD for cards; set `is_edited = true` on user edits — `backend/src/main/java/com/elearning/vocabulary/FlashcardService.java`
- [X] T024 [US1] Implement `UserFlashcardProgressService`: upsert progress row (status, review_count) — `backend/src/main/java/com/elearning/vocabulary/UserFlashcardProgressService.java`
- [X] T025 [US1] Implement `MatchingResultService`: save score + time — `backend/src/main/java/com/elearning/vocabulary/MatchingResultService.java`

### Vocabulary — API Endpoints (contracts/api-vocab.md)

- [X] T026 [US1] `POST /api/documents/import` — `backend/src/main/java/com/elearning/vocabulary/DocumentController.java`
- [X] T027 [P] [US1] `GET/POST/PATCH/DELETE /api/decks`, `GET/POST /api/decks/{id}/flashcards` — `backend/src/main/java/com/elearning/vocabulary/DeckController.java`
- [X] T028 [P] [US1] `PATCH/DELETE /api/flashcards/{id}`, `PATCH /api/flashcards/{id}/progress` — `backend/src/main/java/com/elearning/vocabulary/FlashcardController.java`
- [X] T029 [P] [US1] `GET /api/decks/{id}/matching`, `POST /api/matching/{deckId}/result` — `backend/src/main/java/com/elearning/vocabulary/MatchingController.java`

### Vocabulary — Frontend

- [X] T030 [US1] Build `DeckListPage` and `DeckDetailPage` (card list, create/rename/delete deck) — `frontend/src/pages/vocabulary/DeckListPage.tsx`, `DeckDetailPage.tsx`
- [X] T031 [US1] Build `DocumentImportPage`: file upload (≤ 5 MB guard) + text paste + language selector — `frontend/src/pages/vocabulary/DocumentImportPage.tsx`
- [X] T032 [US1] Build `FlashcardReviewPage`: flip animation, "Mastered" / "Needs Review" buttons, Pinyin display for `zh` — `frontend/src/pages/vocabulary/FlashcardReviewPage.tsx`
- [X] T033 [US1] Build `MatchingExercisePage`: two-column drag-or-click, realtime timer, score display — `frontend/src/pages/vocabulary/MatchingExercisePage.tsx`
- [X] T034 [US1] Build `FlashcardEditModal`: inline edit for term/phonetic/meaning_vi/example — `frontend/src/components/vocabulary/FlashcardEditModal.tsx`

**Checkpoint**: Full US1 flow works end-to-end. All matching_results rows saved. is_edited = true after card edit.

---

## Phase 4: User Story 5 — Admin manages users and content (Priority: P2)

**Goal**: Admin can lock/unlock users, change roles, create public decks, upload videos and exercises.

**Independent Test**: Lock a student account → student's JWT is rejected. Admin creates a public deck → all students can see it.

### Admin — Backend

- [X] T035 [P] [US5] Implement `AdminUserService`: paginated user list (search, filter by role/status), update status/role — `backend/src/main/java/com/elearning/user/AdminUserService.java`
- [X] T036 [P] [US5] `GET /api/admin/users`, `GET/PATCH /api/admin/users/{id}` — `backend/src/main/java/com/elearning/user/AdminUserController.java`
- [X] T037 [US5] Add `@PreAuthorize("hasRole('ADMIN')")` guards to all admin endpoints — `AdminUserController.java`, `VideoController.java`, `ExerciseController.java`

### Admin — Frontend

- [X] T038 [US5] Build `AdminUserListPage`: table with search/pagination, Lock/Unlock button, role badge — `frontend/src/pages/admin/AdminUserListPage.tsx`
- [X] T039 [US5] Build `AdminUserDetailPage`: view profile, change role, change status — `frontend/src/pages/admin/AdminUserDetailPage.tsx`

**Checkpoint**: Admin can lock account; locked student's API calls return 403.

---

## Phase 5: User Story 2 — Listening: video + subtitles + exercise (Priority: P2)

**Goal**: Watch video with bilingual subtitles, click word for lookup, complete listening quiz.

**Independent Test**: Play a video, verify subtitles sync within ±200 ms, click a word, submit a listening exercise, verify score in `user_attempts`.

### Listening — Backend

- [X] T040 [P] [US2] Create JPA entities: `Video`, `Subtitle`, `Exercise`, `Question`, `AnswerOption`, `UserAttempt`, `UserAnswer` — `backend/src/main/java/com/elearning/listening/`
- [X] T041 [US2] Implement `VideoService`: save YouTube URL or generate S3 pre-signed URL (≤ 100 MB guard) — `backend/src/main/java/com/elearning/listening/VideoService.java`
- [X] T042 [US2] Implement `SubtitleService`: bulk insert/replace per language — `backend/src/main/java/com/elearning/listening/SubtitleService.java`
- [X] T043 [US2] Implement `ExerciseService` + `UserAttemptService`: score calculation (append-only, no overwrite) — `backend/src/main/java/com/elearning/listening/ExerciseService.java`, `UserAttemptService.java`

### Listening — API Endpoints (contracts/api-listening.md)

- [X] T044 [P] [US2] `GET/POST/DELETE /api/videos`, `GET/POST /api/videos/{id}/subtitles/bulk` — `backend/src/main/java/com/elearning/listening/VideoController.java`
- [X] T045 [P] [US2] `GET /api/exercises`, `GET /api/exercises/{id}`, `POST /api/exercises/{id}/attempts`, `GET /api/exercises/{id}/attempts` — `backend/src/main/java/com/elearning/listening/ExerciseController.java`

### Listening — Frontend

- [X] T046 [US2] Build `VideoPlayerPage`: embed YouTube iframe or HTML5 `<video>` for S3 uploads; subtitle overlay synced to `currentTime` — `frontend/src/pages/listening/VideoPlayerPage.tsx`
- [X] T047 [US2] Build subtitle rendering component: two-line bilingual display, clickable words trigger `WordLookupPopup` — `frontend/src/components/listening/SubtitleOverlay.tsx`, `WordLookupPopup.tsx`
- [X] T048 [US2] Build `ListeningExercisePage`: render multiple-choice and fill-blank questions, submit, show score — `frontend/src/pages/listening/ListeningExercisePage.tsx`

**Checkpoint**: Subtitles display in sync; word click shows definition; attempt score saved; re-attempt creates new row.

---

## Phase 6: User Story 3 — Speaking with AI feedback (Priority: P3)

**Goal**: Record ≤ 2 min audio → STT transcript → AI pronunciation + grammar score → 15-day expiry lifecycle.

**Independent Test**: Record 30 s, verify transcript appears, verify `expires_at` = now + 15 days, verify `grammar_errors` JSONB is populated.

### Speaking — Backend

- [ ] T049 [P] [US3] Create JPA entities: `SpeakingRecording`, `SpeakingAnalysis` — `backend/src/main/java/com/elearning/speaking/`
- [ ] T050 [US3] Implement `RecordingService`: validate ≤ 120 s and ≤ 3 MB, generate S3 pre-signed URL (`recordings/` prefix), set `expires_at = now() + 15 days` — `backend/src/main/java/com/elearning/speaking/RecordingService.java`
- [ ] T051 [US3] Implement `SttService`: call OpenAI Whisper API with audio S3 URL, store transcript — `backend/src/main/java/com/elearning/ai/SttService.java`
- [ ] T052 [US3] Implement `SpeakingAnalysisService`: call Gemini/GPT-4o-mini for grammar errors + suggestions; for `language = zh` include placeholder for tone scoring (Azure deferred) — `backend/src/main/java/com/elearning/ai/SpeakingAnalysisService.java`
- [ ] T053 [US3] Implement `PATCH /internal/recordings/{id}/mark-deleted` endpoint (called by cron/Lambda) — `backend/src/main/java/com/elearning/speaking/RecordingLifecycleController.java`
- [ ] T054 [US3] Implement scheduled cron job: query `WHERE expires_at < now() AND is_deleted = false`, check S3 existence, set `is_deleted = true` — `backend/src/main/java/com/elearning/speaking/RecordingExpiryJob.java`

### Speaking — API Endpoints (contracts/api-speaking.md)

- [ ] T055 [P] [US3] `POST /api/recordings/upload-url`, `POST /api/recordings/{id}/analyze`, `GET /api/recordings/{id}`, `GET /api/recordings` — `backend/src/main/java/com/elearning/speaking/RecordingController.java`

### Speaking — Frontend

- [ ] T056 [US3] Build `SpeakingRecorderPage`: `MediaRecorder` API recording, live waveform visualizer, 2-minute countdown, upload to S3 pre-signed URL — `frontend/src/pages/speaking/SpeakingRecorderPage.tsx`
- [ ] T057 [US3] Build `SpeakingAnalysisPage`: display pronunciation score gauge, `grammar_errors` list with corrections, suggestions; show "Audio expired" state when `is_deleted = true` — `frontend/src/pages/speaking/SpeakingAnalysisPage.tsx`
- [ ] T058 [US3] Build `SpeakingHistoryPage`: list all recordings with score and expiry date — `frontend/src/pages/speaking/SpeakingHistoryPage.tsx`

**Checkpoint**: Record → upload → transcript visible → analysis JSON visible. expires_at = now+15d. Cron sets is_deleted=true for expired rows.

---

## Phase 7: User Story 4 — Reading & Writing (Priority: P3)

**Goal**: Reading comprehension quiz on a text passage; writing essay graded by AI.

**Independent Test**: Submit answers to a reading exercise; re-attempt and verify both rows in `user_attempts`. Submit a writing essay; verify `writing_feedback` is populated.

### Reading — Backend (shares Exercise entities from Phase 5)

- [ ] T059 [US4] Implement `POST /api/exercises` for `skill_type = reading` (admin only): save `passage_text`, support Hanzi — `backend/src/main/java/com/elearning/listening/ExerciseController.java` (extend existing)
- [ ] T060 [US4] Build `ReadingExercisePage`: display passage text (CJK font enforced), render questions, submit, show score, link to history — `frontend/src/pages/reading/ReadingExercisePage.tsx`

### Writing — Backend

- [ ] T061 [P] [US4] Create JPA entities: `WritingPrompt`, `WritingSubmission`, `WritingFeedback` — `backend/src/main/java/com/elearning/writing/`
- [ ] T062 [US4] Implement `WritingFeedbackService`: call Gemini/GPT-4o-mini with essay content, parse `grammar_score`, `vocabulary_score`, `overall_score`, `detailed_feedback` JSONB — `backend/src/main/java/com/elearning/ai/WritingFeedbackService.java`
- [ ] T063 [P] [US4] `GET/POST/PATCH/DELETE /api/writing-prompts`, `POST /api/writing-submissions`, `GET /api/writing-submissions/{id}`, `GET /api/writing-submissions` — `backend/src/main/java/com/elearning/writing/WritingController.java`

### Writing — Frontend

- [ ] T064 [US4] Build `WritingPromptPage`: display prompt description (Hanzi rendered with Noto Sans SC), textarea with IME support (`onCompositionStart/End` to prevent encoding errors) — `frontend/src/pages/writing/WritingPromptPage.tsx`
- [ ] T065 [US4] Build `WritingFeedbackPage`: display AI scores (gauge), `detailed_feedback.errors` list, vocabulary suggestions — `frontend/src/pages/writing/WritingFeedbackPage.tsx`

**Checkpoint**: Reading attempt appended (not overwritten) on re-attempt. Writing feedback JSONB populated within 5 s.

---

## Phase 8: User Story 3 cont. + Progress Dashboard (Priority: P3)

**Goal**: Progress dashboard showing streak, mastered flashcards, exercise history with highest + latest score.

**Independent Test**: Complete exercises from multiple modules; verify `learning_progress` totals update; dashboard shows highest and latest score per exercise.

### Progress — Backend

- [ ] T066 [US3] Create JPA entity `LearningProgress` (1-to-1 with User) — `backend/src/main/java/com/elearning/progress/LearningProgress.java`
- [ ] T067 [US3] Implement `LearningProgressService`: update `total_flashcards_mastered` when status → mastered; update `total_exercises_completed` after attempt; update `streak_days` and `last_activity_date` on any activity — `backend/src/main/java/com/elearning/progress/LearningProgressService.java`
- [ ] T068 [P] [US3] `GET /api/progress`, `GET /api/progress/history` (aggregate highest + latest score per exercise) — `backend/src/main/java/com/elearning/progress/ProgressController.java`

### Progress — Frontend

- [ ] T069 [US3] Build `DashboardPage`: streak counter, mastered flashcard count, completed exercises count; exercise history table with highest and latest score columns — `frontend/src/pages/DashboardPage.tsx`

**Checkpoint**: Dashboard reflects updated stats after each activity across all modules.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, performance, responsive UI, and Chinese-specific validation.

- [ ] T070 [P] Add file-size guard middleware to all upload endpoints (return 413 if exceeded) — `backend/src/main/java/com/elearning/common/FileSizeValidationFilter.java`
- [ ] T071 [P] Add frontend file-size pre-upload checks in all upload components (before request is sent) — `frontend/src/utils/fileValidation.ts`
- [ ] T072 [P] Configure S3 Lifecycle Rule on `recordings/` prefix (15-day expiry) via AWS CLI or Terraform — `infra/s3-lifecycle.json`
- [ ] T073 [P] Implement Chinese-specific font enforcement: ensure all `language = zh` content areas use `Noto Sans SC` explicitly via CSS class — `frontend/src/styles/chinese.css`
- [ ] T074 [P] Configure HSK level selector in exercise and writing prompt forms (switch between CEFR and HSK 1–6 based on `language` field) — `frontend/src/components/LevelSelector.tsx`
- [ ] T075 [P] Add IME composition guard (`onCompositionStart/End`) to all admin text inputs (writing prompts, questions) — `frontend/src/components/ChineseTextInput.tsx`
- [ ] T076 Run all quickstart.md validation scenarios against staging environment — `specs/001-elearning-platform/quickstart.md`
- [ ] T077 [P] Add Swagger/OpenAPI documentation to all backend controllers — `backend/src/main/java/com/elearning/`
- [ ] T078 Responsive layout audit: test all pages at 375px (mobile), 768px (tablet), 1280px (desktop) breakpoints — `frontend/src/`
- [ ] T079 Security audit: verify JWT expiry, BCrypt rounds ≥ 10, no sensitive data in error responses, CORS configured for production origin — `backend/src/main/java/com/elearning/auth/SecurityConfig.java`
- [ ] T080 Performance check: verify API p95 < 500 ms for standard endpoints; AI endpoints return within 5 s — `quickstart.md §5`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → All User Story Phases → Phase 9 (Polish)
```

- **Phase 1**: No dependencies — start immediately
- **Phase 2**: Requires Phase 1 — BLOCKS all user story work
- **Phase 3 (US1)**: Requires Phase 2 — this is the MVP
- **Phase 4 (US5/Admin)**: Requires Phase 2 — can run in parallel with Phase 3
- **Phase 5 (US2/Listening)**: Requires Phase 2 — can run in parallel with Phase 3 & 4
- **Phase 6 (US3/Speaking)**: Requires Phase 2 — can run in parallel
- **Phase 7 (US4/Reading+Writing)**: Requires Phase 2 and Phase 5 entities (Exercise) — start after T040
- **Phase 8 (Progress)**: Requires Phase 3 (FlashcardProgress) and Phase 5 (UserAttempt) to be complete
- **Phase 9 (Polish)**: Requires all desired stories complete

### Parallel Opportunities Per Phase

**Phase 2** (run together):
```
T007 (User entity) | T008 (JWT) | T010 (Exception handler) | T011 (S3Service) | T012 (DTOs) | T013 (Axios client)
```

**Phase 3** (run together after T007/T008 done):
```
T014-T018 (Auth) can overlap with T019 (Vocab entities)
T026 | T027 | T028 | T029 (Vocab API controllers — different files)
T030 | T031 | T032 | T033 | T034 (Vocab frontend pages — different files)
```

**Phase 5** (run together after T007):
```
T040 (entities) | then T044 | T045 (controllers) | T046 | T047 | T048 (frontend)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1** + **Phase 2** → foundation ready
2. Complete **Phase 3** (US1: register + flashcard full flow)
3. **STOP & VALIDATE**: register → import → review → matching exercise works end-to-end
4. Demo or deploy MVP

### Incremental Delivery

| Step | Deliverable | Value |
|---|---|---|
| Phase 1+2 | Infrastructure | Dev environment working |
| + Phase 3 | Vocabulary module | MVP: vocab learning live |
| + Phase 4 | Admin management | User control live |
| + Phase 5 | Listening module | Video learning live |
| + Phase 6 | Speaking + AI | AI voice feedback live |
| + Phase 7 | Reading + Writing | 4-skill platform complete |
| + Phase 8 | Progress dashboard | Full analytics live |
| + Phase 9 | Polish | Production-ready |

### Parallel Team Strategy

With 3 developers after Phase 2 is done:
- **Dev A**: Phase 3 (Vocabulary — core MVP)
- **Dev B**: Phase 4 (Admin) + Phase 5 (Listening)
- **Dev C**: Phase 6 (Speaking) + Phase 7 (Writing)

---

## Notes

- `[P]` tasks = different files, no dependency on other incomplete tasks in same phase
- `[US#]` label maps each task to its spec.md User Story for traceability
- **Never** add `UNIQUE(user_id, exercise_id)` to `user_attempts` — append-only by constitution
- **Never** add an admin approval step for flashcard deck operations — user autonomy by constitution
- All file upload endpoints must enforce size limits at both frontend (`fileValidation.ts`) and backend (`FileSizeValidationFilter`)
- Chinese content: always use `Noto Sans SC` font class; store Pinyin with tone marks (nǐ hǎo not ni hao)
- Commit after each task or logical group; stop at any checkpoint to validate independently
