# Multilingual E-Learning Platform Engine

Hệ thống ứng dụng web quản lý và vận hành chương trình học ngoại ngữ song ngữ (English / Chinese) tích hợp trí tuệ nhân tạo (Groq Whisper STT + NVIDIA NIM Llama 3.1 AI Engine).

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

## Entity Relationship Schema

```mermaid
erDiagram
    ACCOUNT ||--o{ VOCAB_DECK : "owns"
    ACCOUNT ||--o{ ASSESSMENT_LOG : "generates"
    VOCAB_DECK ||--o{ FLASHCARD : "contains"
    LESSON_ITEM ||--o{ EXERCISE_ITEM : "includes"
    EXERCISE_ITEM ||--o{ ASSESSMENT_LOG : "targets"

    ACCOUNT {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        string role "STUDENT | ADMIN"
        timestamp created_at
    }

    VOCAB_DECK {
        bigint id PK
        bigint account_id FK
        string title
        string language "en | zh"
        boolean is_public
        timestamp created_at
    }

    FLASHCARD {
        bigint id PK
        bigint deck_id FK
        string term
        string phonetic "IPA / Pinyin"
        string meaning
        string example_sentence
        boolean is_mastered
    }

    LESSON_ITEM {
        bigint id PK
        string title
        string skill_type "LISTENING | READING | SPEAKING | WRITING"
        string language "en | zh"
        string media_url
        text content
    }

    EXERCISE_ITEM {
        bigint id PK
        bigint lesson_id FK
        string exercise_type "MULTIPLE_CHOICE | FILL_BLANK | AI_SPEAKING | AI_WRITING"
        text question_data
    }

    ASSESSMENT_LOG {
        bigint id PK
        bigint account_id FK
        bigint exercise_id FK
        float score
        text ai_feedback
        timestamp submitted_at
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

#### Cấu hình biến môi trường cục bộ (Chỉnh sửa trong `.env` hoặc file cấu hình):
* `GROQ_API_KEY`: API Key từ Groq Cloud (Xử lý Whisper STT)
* `NVIDIA_API_KEY`: API Key từ NVIDIA NIM (Xử lý Llama 3.1 AI)
* `CLOUDINARY_URL`: Chuỗi kết nối Cloudinary upload media

---

### Option 2: Production Deployment Environment

Sử dụng `docker-compose.prod.yml` để triển khai môi trường Production kéo các image đã được đóng gói từ Docker Hub:

```bash
# Khởi chạy trên máy chủ Production
docker-compose -f docker-compose.prod.yml up -d
```

#### Các biến môi trường bắt buộc cho Production:
```env
SPRING_PROFILES_ACTIVE=dev
DB_URL=jdbc:postgresql://<neon-or-supabase-host>:5432/elearning_db
DB_USER=<db_user>
DB_PASS=<db_pass>
JWT_SECRET=<production_jwt_secret>
GROQ_API_KEY=<your_groq_api_key>
NVIDIA_API_KEY=<your_nvidia_api_key>
NVIDIA_API_URL=https://integrate.api.nvidia.com/v1/chat/completions
NVIDIA_API_MODEL=meta/llama-3.1-70b-instruct
CLOUDINARY_URL=<your_cloudinary_url>
```

---

## Default Endpoints
* **Frontend Application**: `http://localhost` (Cổng 80)
* **Backend REST Services**: `http://localhost:8081` (Cổng 8081)
* **PostgreSQL Database**: `localhost:5432`

---

## Preview Diagrams in VS Code

Mở file `README.md` và nhấn phím tắt:
* **`Ctrl + Shift + V`** hoặc **`Ctrl + K V`** (xem trước sơ đồ trực quan).
