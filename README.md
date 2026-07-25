# Multilingual E-Learning Platform Engine

Nền tảng học ngoại ngữ song ngữ (English / Chinese) tích hợp trí tuệ nhân tạo (Groq Whisper STT + NVIDIA NIM Llama 3.1 AI Engine).

🔗 **Live Application Demo**: [https://learningenglish.id.vn](https://learningenglish.id.vn/)

---

## Architecture Blueprint

```mermaid
graph TB
    subgraph FrontendLayer["Frontend Layer"]
        WebFrontend["React 18 + Vite SPA"]
        AudioRecorder["MediaRecorder Web API"]
    end

    subgraph GatewayLayer["API & Security Gateway"]
        SecurityFilter["Spring Security JWT Filter"]
        AuthModule["Auth Module"]
        VocabModule["Vocabulary Module"]
        ListeningModule["Listening Module"]
        SpeakingModule["Speaking Module"]
        TestModule["Assessment Module"]
    end

    subgraph ServiceLayer["Service & AI Processing Layer"]
        SttService["Groq STT Service (Whisper-large-v3)"]
        NvidiaAiClient["NVIDIA NIM Client (Llama-3.1-70b)"]
        MediaService["Media Storage Manager (Cloudinary / S3)"]
    end

    subgraph InfrastructureLayer["Data & Persistence Layer"]
        PostgreSQL[("PostgreSQL 15 Database (Local / Neon.tech / Supabase)")]
        GroqApi["Groq API Engine"]
        NvidiaApi["NVIDIA NIM API Engine"]
        CloudinaryStorage["Cloudinary / S3 Storage"]
    end

    WebFrontend -->|REST API / HTTPS| SecurityFilter
    AudioRecorder -->|Audio Binary Data| WebFrontend

    SecurityFilter --> AuthModule
    SecurityFilter --> VocabModule
    SecurityFilter --> ListeningModule
    SecurityFilter --> SpeakingModule
    SecurityFilter --> TestModule

    VocabModule --> NvidiaAiClient
    SpeakingModule --> SttService
    SpeakingModule --> NvidiaAiClient
    SpeakingModule --> MediaService
    TestModule --> NvidiaAiClient

    SttService --> GroqApi
    NvidiaAiClient --> NvidiaApi
    MediaService --> CloudinaryStorage

    AuthModule --> PostgreSQL
    VocabModule --> PostgreSQL
    ListeningModule --> PostgreSQL
    SpeakingModule --> PostgreSQL
    TestModule --> PostgreSQL

    classDef fe fill:#f8fafc,stroke:#475569,stroke-width:1px
    classDef gw fill:#f0f9ff,stroke:#0284c7,stroke-width:1px
    classDef sv fill:#f0fdf4,stroke:#16a34a,stroke-width:1px
    classDef infra fill:#fff7ed,stroke:#ea580c,stroke-width:1px

    class FrontendLayer fe
    class GatewayLayer gw
    class ServiceLayer sv
    class InfrastructureLayer infra
```

---

## Technical Specifications

| Module | Scope | Stack & Components |
|---|---|---|
| **Authentication & Authorization** | Token management, RBAC enforcement | Spring Security, JWT Bearer Tokens, BCrypt Hashing |
| **Vocabulary & AI Flashcards** | File parsing (.txt, .docx), automated extraction of IPA/Pinyin, translation and example generation | NVIDIA NIM (Llama 3.1 70B), SRS Algorithm, Word Match Game Engine |
| **Listening Module** | Interactive video player with bilingual timestamped subtitles and word lookup | HTML5 Media API, Subtitle Sync Engine |
| **Speaking Module** | Audio recording, high-speed speech-to-text conversion, real-time phonetic and grammar validation | MediaRecorder API, Groq Whisper STT (`whisper-large-v3`), NVIDIA NIM Llama 3.1 |
| **Reading & Writing Assessment** | Contextual reading comprehension and automated essay evaluation | Automated Essay Scoring (AES) via NVIDIA NIM API |
| **Analytics & History** | Persistence of assessment records, progress metrics, and flashcard mastery status | PostgreSQL Relational Database, Audit Logging |

---

## Execution Flow (Speaking Assessment Sequence)

```mermaid
sequenceDiagram
    autonumber
    participant WebClient as Web Client
    participant ApiServer as API Server
    participant Storage as Cloudinary / S3 Storage
    participant GroqService as Groq Whisper STT API
    participant NvidiaService as NVIDIA NIM AI API
    participant Database as PostgreSQL DB

    WebClient->>ApiServer: POST /api/speaking/assess (Audio Payload)
    ApiServer->>Storage: Upload Audio File
    Storage-->>ApiServer: Return Media URL

    par High-Speed Speech-to-Text
        ApiServer->>GroqService: POST /v1/audio/transcriptions (whisper-large-v3)
        GroqService-->>ApiServer: Return Transcript Text
    and Grammar & Scoring Analysis
        ApiServer->>NvidiaService: POST /v1/chat/completions (llama-3.1-70b-instruct)
        NvidiaService-->>ApiServer: Return Score, Phonetic Errors & Suggestions
    end

    ApiServer->>Database: Insert Assessment Record (Score, Feedback, MediaURL)
    ApiServer-->>WebClient: Return 200 OK (JSON Response Payload)
```

---

## Complete Entity Relationship Schema (19 Tables)

```mermaid
erDiagram
    %% User & Authentication Module
    USERS ||--o{ PASSWORD_RESET_TOKENS : "has"
    USERS ||--o{ DOCUMENTS : "uploads"
    USERS ||--o{ FLASHCARD_DECKS : "owns"
    USERS ||--o{ USER_FLASHCARD_PROGRESS : "tracks"
    USERS ||--o{ MATCHING_RESULTS : "plays"
    USERS ||--o{ USER_ATTEMPTS : "attempts"
    USERS ||--o{ SPEAKING_RECORDINGS : "records"
    USERS ||--o{ WRITING_SUBMISSIONS : "submits"

    %% Vocabulary & Flashcard Module
    DOCUMENTS ||--o{ FLASHCARD_DECKS : "sources"
    FLASHCARD_DECKS ||--o{ FLASHCARDS : "contains"
    FLASHCARD_DECKS ||--o{ MATCHING_RESULTS : "has_games"
    FLASHCARDS ||--o{ USER_FLASHCARD_PROGRESS : "has_status"

    %% Listening & Reading Module
    VIDEOS ||--o{ SUBTITLES : "has"
    VIDEOS ||--o{ EXERCISES : "attaches"
    EXERCISES ||--o{ QUESTIONS : "contains"
    QUESTIONS ||--o{ ANSWER_OPTIONS : "has_options"

    %% Attempts & Answers Subsystem
    EXERCISES ||--o{ USER_ATTEMPTS : "recorded_in"
    USER_ATTEMPTS ||--o{ USER_ANSWERS : "contains"
    QUESTIONS ||--o{ USER_ANSWERS : "answers"
    ANSWER_OPTIONS ||--o{ USER_ANSWERS : "selects"

    %% Speaking Module (AI Speech Analysis)
    SPEAKING_RECORDINGS ||--o{ SPEAKING_ANALYSES : "analyzed_by"

    %% Writing Module (AI Essay Feedback)
    WRITING_PROMPTS ||--o{ WRITING_SUBMISSIONS : "has_submissions"
    WRITING_SUBMISSIONS ||--o{ WRITING_FEEDBACKS : "evaluated_by"

    USERS {
        uuid id PK
        string email UK
        string full_name
        string role "student | admin"
        string status "active | locked"
        string primary_learning_language "en | zh"
        timestamp created_at
    }

    PASSWORD_RESET_TOKENS {
        uuid id PK
        uuid user_id FK
        string otp_code
        timestamp expires_at
        boolean is_used
    }

    DOCUMENTS {
        uuid id PK
        uuid uploaded_by FK
        string file_name
        string file_type "txt | csv | docx | text_paste"
        string file_url
        int file_size_kb
    }

    FLASHCARD_DECKS {
        uuid id PK
        uuid owner_id FK
        uuid source_document_id FK
        string name
        string language "en | zh"
        boolean is_public
    }

    FLASHCARDS {
        uuid id PK
        uuid deck_id FK
        string term
        string phonetic "IPA | Pinyin"
        string meaning_vi
        text example_sentence
        string audio_url
        boolean is_ai_generated
        boolean is_edited
    }

    USER_FLASHCARD_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid flashcard_id FK
        string status "new | learning | mastered"
        timestamp last_reviewed_at
    }

    MATCHING_RESULTS {
        uuid id PK
        uuid user_id FK
        uuid deck_id FK
        int score
        float time_seconds
        timestamp played_at
    }

    VIDEOS {
        uuid id PK
        string title
        string language "en | zh"
        string video_source_type "youtube | upload"
        string video_url
        int duration_seconds
    }

    SUBTITLES {
        uuid id PK
        uuid video_id FK
        string subtitle_language "source | vi"
        float start_time
        float end_time
        text text_content
    }

    EXERCISES {
        uuid id PK
        uuid video_id FK
        string title
        string exercise_skill_type "listening | reading"
        string language "en | zh"
    }

    QUESTIONS {
        uuid id PK
        uuid exercise_id FK
        string question_type "multiple_choice | fill_blank"
        text question_text
        int order_index
    }

    ANSWER_OPTIONS {
        uuid id PK
        uuid question_id FK
        text option_text
        boolean is_correct
    }

    USER_ATTEMPTS {
        uuid id PK
        uuid user_id FK
        uuid exercise_id FK
        float score
        int total_questions
        int correct_answers
        timestamp completed_at
    }

    USER_ANSWERS {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        uuid selected_option_id FK
        text user_text_answer
        boolean is_correct
    }

    SPEAKING_RECORDINGS {
        uuid id PK
        uuid user_id FK
        string language "en | zh"
        string audio_url
        int duration_seconds
        timestamp created_at
    }

    SPEAKING_ANALYSES {
        uuid id PK
        uuid recording_id FK
        text transcript
        float pronunciation_score
        float grammar_score
        float overall_score
        text ai_feedback_json
    }

    WRITING_PROMPTS {
        uuid id PK
        string title
        string language "en | zh"
        text prompt_text
        string target_level
    }

    WRITING_SUBMISSIONS {
        uuid id PK
        uuid prompt_id FK
        uuid user_id FK
        text submission_text
        int word_count
        timestamp submitted_at
    }

    WRITING_FEEDBACKS {
        uuid id PK
        uuid submission_id FK
        float grammar_score
        float vocabulary_score
        float overall_score
        text detailed_feedback_json
    }
```

---

## Technical Stack & Infrastructure

* **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Axios
* **Backend**: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA
* **Database**: PostgreSQL 15 (Local PostgreSQL / Neon.tech / Supabase)
* **Speech-to-Text AI**: Groq API (`whisper-large-v3`)
* **Text AI / Analysis Engine**: NVIDIA NIM API (`meta/llama-3.1-70b-instruct`)
* **Media Storage**: Cloudinary / AWS S3
* **Containerization & Registry**: Docker, Docker Hub (`hoangmelinh/elearning-backend`, `hoangmelinh/elearning-frontend`)

---

## Setup & Deployment Guide

### Option 1: Local Development Environment

Sử dụng `docker-compose.yml` để chạy môi trường phát triển cục bộ với PostgreSQL container:

```bash
# Di chuyển vào thư mục dự án
cd website_elearning

# Khởi chạy các container cho môi trường Dev
docker-compose up -d
```

---

### Option 2: Production Deployment Environment (AWS EC2)

Dự án sử dụng GitHub Actions CI/CD (`.github/workflows/ci-cd.yml`) tự động đóng gói Docker Images đẩy lên Docker Hub và deploy tự động tới máy chủ **AWS EC2**:

```bash
# Triển khai thủ công trên server EC2
docker-compose -f docker-compose.prod.yml up -d
```

---

## Default Endpoints
* **Production Live Web App**: [https://learningenglish.id.vn](https://learningenglish.id.vn/)
* **Local Development Web App**: `http://localhost` (Cổng 80)
* **Backend REST Services**: `http://localhost:8081` (Cổng 8081)

---

## Preview Diagrams in VS Code

Mở file `README.md` và nhấn phím tắt:
* **`Ctrl + Shift + V`** hoặc **`Ctrl + K V`** (xem trước sơ đồ trực quan).
