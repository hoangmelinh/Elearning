# E-Learning Platform Constitution

<!-- Website Học Tiếng Anh & Tiếng Trung Trực Tuyến -->

## Core Principles

### I. Bilingual-First (NON-NEGOTIABLE)
Every content entity (Flashcard Deck, Video, Exercise, Writing Prompt) MUST carry a `language` field (`en` | `zh`). No feature ships without supporting both English and Chinese. UI, business logic, and AI integrations must behave correctly for both languages. Chinese support must handle Hanzi display, Pinyin phonetics with tone marks, and HSK level taxonomy.

### II. Schema Authority
`schema.sql` is the single source of truth for the database. Agents MUST NOT create tables, columns, or enum values outside of `schema.sql` without updating it first. All 19 tables and their constraints, indexes, and triggers are canonical.

### III. File-Size & Storage Contracts (NON-NEGOTIABLE)
All file uploads are governed by hard limits enforced at BOTH frontend and backend:
- Documents (flashcard import): ≤ 5 MB → `s3://…/documents/`
- Videos: ≤ 100 MB → `s3://…/videos/`
- Audio recordings: ≤ 2 min (~2–3 MB) → `s3://…/recordings/` — **auto-delete after 15 days** via S3 Lifecycle Rule
- Avatars: ≤ 1 MB → `s3://…/avatars/` — overwrite on update

Agents must implement pre-signed URL validation AND a backend guard. No exceptions.

### IV. History Preservation
`user_attempts` rows are NEVER overwritten. Every re-attempt appends a new row. Likewise, `speaking_analysis` and `transcript_text` survive after audio file deletion (`is_deleted = true`). Agents must not add `ON CONFLICT DO UPDATE` logic on attempts.

### V. User Autonomy for Flashcard Decks
Users own their decks completely. No admin approval workflow exists for deck creation, editing, public/private toggle, or card CRUD. Agents must not introduce an approval step.

### VI. AI Integration Boundaries
- Speech-to-Text: OpenAI Whisper API or Web Speech API (browser-native)
- Grammar/Writing analysis: Gemini API or OpenAI GPT-4o-mini
- Chinese tone scoring requires a dedicated API or post-processing step; Whisper alone is insufficient
- AI-extracted flashcards are editable in-place; set `is_edited = true` on modification

### VII. Security Baseline
- Passwords: BCrypt hashing
- Sessions: JWT (access token + refresh token)
- All API routes protected by JWT Bearer Token middleware
- File size validation: frontend (early block) + backend (bypass protection)

### VIII. Performance Targets
- Standard API responses: < 500 ms p95
- AI processing (STT + grammar analysis): 2–5 seconds acceptable
- UI: Responsive for desktop + mobile; font must include CJK glyphs (Noto Sans SC or equivalent)

## Technology Constraints

| Layer | Technology |
|---|---|
| Frontend | React.js + TailwindCSS (or Ant Design), Axios, Web Speech API |
| Backend | Java Spring Boot (RESTful, Spring Security, Spring Data JPA) **or** Node.js Express |
| Database | PostgreSQL — run `schema.sql` verbatim to initialize |
| AI | Whisper API / Web Speech API + Gemini API / GPT-4o-mini |
| Storage | AWS S3 (Free Tier) |
| Container | Docker |
| Deployment | AWS Free Tier (EC2 + RDS) **or** Render/Koyeb + Supabase/Neon + Vercel |

## Definition of Done

A module is **Done** when:
- [ ] All functional requirements in `spec.md §2` work for **both** `en` and `zh`
- [ ] API endpoints validate input, return structured errors, enforce file-size limits
- [ ] Data written matches `schema.sql` exactly (no undocumented columns)
- [ ] UI is responsive; CJK characters render without tofu boxes
- [ ] Unit/integration tests cover: scoring logic, AI parsing, JWT auth flows

## Governance

This constitution supersedes all other implementation preferences. Any amendment requires:
1. A written rationale in the PR description
2. Update to this file with new version and date
3. Migration plan if schema or API contracts change

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
