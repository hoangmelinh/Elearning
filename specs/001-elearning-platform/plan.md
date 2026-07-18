# Implementation Plan: Bilingual E-Learning Platform

**Branch**: `001-elearning-platform` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-elearning-platform/spec.md`

---

## Summary

Build a bilingual (English + Chinese) e-learning web platform supporting four language skills: Vocabulary/Flashcard, Listening, Speaking (AI-assisted), Reading, and Writing. The platform uses a React frontend, a Spring Boot (or Node.js) backend, PostgreSQL (initialized from `docs/Schema`), AWS S3 for file storage, and third-party AI APIs (Whisper + Gemini/GPT-4o-mini) for speech and writing analysis.

---

## Technical Context

**Language/Version**: Java 21 (Spring Boot 3.x) for backend; React 18 + TypeScript for frontend

**Primary Dependencies**:
- Backend: Spring Security, Spring Data JPA, Hibernate, AWS SDK v2, OpenAI/Gemini Java client
- Frontend: React Router v6, TailwindCSS (or Ant Design), Axios, Web Speech API / MediaRecorder API

**Storage**: PostgreSQL 15 (schema initialized from `docs/Schema`); AWS S3 (Free Tier)

**Testing**: JUnit 5 + Mockito (backend); Vitest + React Testing Library (frontend)

**Target Platform**: Docker containers — Render/Koyeb (backend) + Supabase/Neon (PostgreSQL) + Vercel (frontend)

**Project Type**: Full-stack web application (REST API backend + SPA frontend)

**Performance Goals**: API p95 < 500 ms; AI processing ≤ 5 s; video subtitle sync ±200 ms

**Constraints**: AWS S3 Free Tier limits (5 GB, 20k GET, 2k PUT/month); audio recordings ≤ 2 min; file sizes per constitution

**Scale/Scope**: < 50 concurrent users at launch; 19 DB tables; 6 functional modules

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| Bilingual-First | ✅ PASS | All entities carry `language` field; Chinese requirements addressed |
| Schema Authority | ✅ PASS | `docs/Schema` is DDL source; no new tables without updating it |
| File-Size & Storage Contracts | ✅ PASS | Limits and S3 prefixes defined; dual validation required |
| History Preservation | ✅ PASS | `user_attempts` append-only; audio expiry keeps transcript |
| User Autonomy for Decks | ✅ PASS | No admin approval flow for student decks |
| AI Integration Boundaries | ✅ PASS | Whisper + Gemini/GPT-4o-mini; tone scoring flagged as open item |
| Security Baseline | ✅ PASS | BCrypt + JWT; dual file-size validation |
| Performance Targets | ✅ PASS | Targets documented above |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-elearning-platform/
├── spec.md              # Feature specification (source of truth)
├── plan.md              # This file
├── research.md          # Phase 0 — AI API comparison, S3 lifecycle, tone scoring options
├── data-model.md        # Phase 1 — Entity relationships, field constraints
├── quickstart.md        # Phase 1 — Local dev setup and validation guide
├── contracts/
│   ├── api-auth.md      # Auth endpoints (register, login, refresh, reset password)
│   ├── api-vocab.md     # Vocabulary endpoints (decks, flashcards, matching)
│   ├── api-listening.md # Video, subtitle, exercise endpoints
│   ├── api-speaking.md  # Recording upload, STT, analysis endpoints
│   ├── api-writing.md   # Writing prompt + submission + feedback endpoints
│   └── api-admin.md     # Admin user management endpoints
└── tasks.md             # Phase 2 — Sprint-ordered task list (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/main/java/com/elearning/
│   ├── auth/            # JWT, BCrypt, OTP reset
│   ├── user/            # User entity, admin management
│   ├── vocabulary/      # Deck, Flashcard, Progress, Matching
│   ├── listening/       # Video, Subtitle, Exercise, Question
│   ├── speaking/        # Recording, STT, AI analysis, S3 lifecycle
│   ├── writing/         # Prompt, Submission, AI feedback
│   ├── progress/        # LearningProgress aggregation
│   ├── storage/         # AWS S3 pre-signed URL service
│   └── ai/              # Whisper + Gemini/GPT-4o-mini clients
└── src/test/

frontend/
├── src/
│   ├── components/      # Shared UI components (FlashCard, VideoPlayer, AudioRecorder…)
│   ├── pages/           # Route-level pages per module
│   ├── services/        # Axios API clients
│   ├── hooks/           # Custom React hooks (useAuth, useRecorder…)
│   └── i18n/            # UI language strings (vi, en, zh labels)
└── tests/

docs/
├── Project spec.MD      # Original project specification
├── Data Dictionary.md   # Entity definitions
└── Schema               # PostgreSQL DDL (canonical)
```

**Structure Decision**: Full-stack split (backend/ + frontend/) with shared `docs/` folder. This matches the web application pattern from the plan template Option 2.

---

## Complexity Tracking

> No constitution violations identified. All design decisions align with principles.

---

## Implementation Roadmap (from spec §9)

| Sprint | Scope | Key features |
|---|---|---|
| Sprint 0 | Foundation | DB init (`docs/Schema`), S3 bucket + IAM, JWT auth (AUTH-01, AUTH-02), Docker setup |
| Sprint 1 | Admin + Vocabulary | ADM-01, VOC-01 → VOC-04 (AI extraction pipeline, flashcard CRUD, matching) |
| Sprint 2 | Listening | LIS-01, LIS-02 (video player, subtitle sync, listening exercises) |
| Sprint 3 | Speaking + AI | SPEAK-01, SPEAK-02, S3 Lifecycle Rule, cron job for `is_deleted` sync |
| Sprint 4 | Reading + Writing | TEST-01, TEST-02 (reading comprehension, AI writing feedback) |
| Sprint 5 | Polish | TEST-03 (progress dashboard), responsive UI, performance hardening, security audit |
