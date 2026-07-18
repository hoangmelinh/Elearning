# DATA DICTIONARY — Website Học Tiếng Anh & Tiếng Trung Trực Tuyến

Tài liệu này mô tả các thực thể dữ liệu (entities), thuộc tính, kiểu dữ liệu và quan hệ giữa chúng, làm cơ sở để thiết kế ERD/Database. Được suy ra từ SRS đã có, có bổ sung các thực thể/thuộc tính còn thiếu để đảm bảo tính đầy đủ.

---

## 1. Phân hệ Xác thực & Người dùng

### USERS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| full_name | VARCHAR(100) | |
| email | VARCHAR(150), UNIQUE | |
| phone | VARCHAR(20), UNIQUE, NULLABLE | |
| password_hash | VARCHAR(255) | Mã hóa BCrypt |
| role | ENUM('student','admin') | |
| status | ENUM('active','locked') | |
| avatar_url | VARCHAR(255), NULLABLE | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### PASSWORD_RESET_TOKENS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| user_id | UUID/FK → USERS | |
| otp_code | VARCHAR(10) | |
| expires_at | TIMESTAMP | |
| is_used | BOOLEAN | |

*Bổ sung so với SRS gốc: SRS chỉ nói "gửi OTP/link" nhưng chưa mô tả cách lưu trạng thái token — bảng này cần thiết để tránh dùng lại OTP đã hết hạn.*

---

## 2. Phân hệ Từ vựng (Flashcard)

### DOCUMENTS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| uploaded_by | UUID/FK → USERS | |
| file_name | VARCHAR(255) | |
| file_type | ENUM('txt','csv','docx','text_paste') | |
| file_url | VARCHAR(255), NULLABLE | S3 object URL/key. NULL nếu là dán văn bản trực tiếp |
| file_size_kb | INT, NULLABLE | |
| created_at | TIMESTAMP | |

### FLASHCARD_DECKS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| name | VARCHAR(150) | |
| language | ENUM('en','zh') | |
| owner_id | UUID/FK → USERS | Người tạo (user hoặc admin) |
| source_document_id | UUID/FK → DOCUMENTS, NULLABLE | |
| is_public | BOOLEAN | Mặc định: Admin tạo → public; User tạo → private (user tự đổi được) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

*Quyết định: User được toàn quyền tùy biến deck của mình (đổi tên, thêm/sửa/xóa flashcard, chuyển public/private), không cần duyệt.*

### FLASHCARDS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| deck_id | UUID/FK → FLASHCARD_DECKS | |
| term | VARCHAR(255) | Từ gốc Anh/Trung |
| phonetic | VARCHAR(255) | IPA hoặc Pinyin |
| meaning_vi | VARCHAR(255) | |
| example_sentence | TEXT | |
| audio_url | VARCHAR(255), NULLABLE | |
| is_ai_generated | BOOLEAN | Đánh dấu nếu do AI trích xuất tự động (VOC-01) |
| is_edited | BOOLEAN | true nếu user đã chỉnh sửa lại nội dung AI trích xuất |
| updated_at | TIMESTAMP | |

*Quyết định: cho phép user sửa trực tiếp (term, phonetic, meaning_vi, example_sentence) trên chính bản ghi — không tạo bản sao riêng. `is_edited` dùng để phân biệt/thống kê độ chính xác AI.*

### USER_FLASHCARD_PROGRESS
*(Bảng trung gian many-to-many — bắt buộc phải có để lưu trạng thái "Đã thuộc"/"Cần học lại" theo từng user, điều SRS mô tả nhưng chưa mô hình hóa dữ liệu)*
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| user_id | UUID/FK → USERS | |
| flashcard_id | UUID/FK → FLASHCARDS | |
| status | ENUM('new','learning','mastered') | |
| review_count | INT | |
| last_reviewed_at | TIMESTAMP | |

### MATCHING_RESULTS
*(Kết quả bài luyện tập ghép cột — VOC-03)*
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| user_id | UUID/FK → USERS | |
| deck_id | UUID/FK → FLASHCARD_DECKS | |
| score | INT | |
| time_taken_seconds | INT | |
| completed_at | TIMESTAMP | |

---

## 3. Phân hệ Luyện Nghe (Video & Audio)

### VIDEOS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| title | VARCHAR(255) | |
| language | ENUM('en','zh') | |
| source_type | ENUM('youtube','upload') | |
| video_url | VARCHAR(255) | S3 object URL nếu source_type='upload'; link nhúng nếu 'youtube' |
| duration_seconds | INT | |
| created_by | UUID/FK → USERS | |
| created_at | TIMESTAMP | |

### SUBTITLES
*(Từng dòng phụ đề đồng bộ theo thời gian — SRS nói "chạy đồng bộ" nhưng chưa có cấu trúc lưu timestamp)*
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| video_id | UUID/FK → VIDEOS | |
| language | ENUM('source','vi') | source = Anh/Trung gốc |
| start_time_ms | INT | |
| end_time_ms | INT | |
| text | TEXT | |
| order_index | INT | |

### EXERCISES
*(Dùng chung cho Listening — LIS-02 và Reading — TEST-01, tránh trùng lặp cấu trúc)*
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| skill_type | ENUM('listening','reading') | |
| title | VARCHAR(255) | |
| video_id | UUID/FK → VIDEOS, NULLABLE | Có nếu là bài nghe |
| passage_text | TEXT, NULLABLE | Có nếu là bài đọc |
| language | ENUM('en','zh') | |
| level | VARCHAR(20), NULLABLE | Sơ/Trung/Cao cấp |
| created_at | TIMESTAMP | |

### QUESTIONS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| exercise_id | UUID/FK → EXERCISES | |
| question_type | ENUM('multiple_choice','fill_blank') | |
| question_text | TEXT | |
| correct_answer_text | VARCHAR(255), NULLABLE | Dùng cho dạng fill_blank |
| order_index | INT | |

### ANSWER_OPTIONS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| question_id | UUID/FK → QUESTIONS | |
| option_text | VARCHAR(255) | |
| is_correct | BOOLEAN | |

### USER_ATTEMPTS
*(Dùng chung cho mọi lượt làm bài Reading/Listening — TEST-03 "lưu lịch sử học tập")*
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| user_id | UUID/FK → USERS | |
| exercise_id | UUID/FK → EXERCISES | |
| score | DECIMAL(5,2) | |
| started_at | TIMESTAMP | |
| completed_at | TIMESTAMP | |

### USER_ANSWERS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| attempt_id | UUID/FK → USER_ATTEMPTS | |
| question_id | UUID/FK → QUESTIONS | |
| selected_option_id | UUID/FK → ANSWER_OPTIONS, NULLABLE | |
| answer_text | VARCHAR(255), NULLABLE | Dùng cho fill_blank |
| is_correct | BOOLEAN | |

---

## 4. Phân hệ Luyện Nói & AI

### SPEAKING_RECORDINGS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| user_id | UUID/FK → USERS | |
| prompt_text | TEXT, NULLABLE | Câu mẫu yêu cầu đọc/nói theo |
| audio_url | VARCHAR(255) | S3 object URL |
| transcript_text | TEXT | Kết quả Speech-to-Text |
| created_at | TIMESTAMP | |
| expires_at | TIMESTAMP | Thời điểm sẽ bị xóa khỏi S3 (auto-delete) |
| is_deleted | BOOLEAN | true khi file audio đã bị xóa khỏi S3 (giữ lại transcript + analysis để user xem lịch sử) |

### SPEAKING_ANALYSIS
*(Kết quả phân tích AI — tách riêng bảng để không phình bảng recordings, và có thể lưu lại nếu re-analyze)*
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| recording_id | UUID/FK → SPEAKING_RECORDINGS | |
| pronunciation_score | DECIMAL(5,2) | |
| grammar_errors | JSONB | Danh sách lỗi ngữ pháp có cấu trúc |
| suggestions | JSONB | Gợi ý cải thiện |
| created_at | TIMESTAMP | |

---

## 5. Phân hệ Viết & Kiểm tra tổng hợp

### WRITING_PROMPTS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| title | VARCHAR(255) | |
| description | TEXT | |
| language | ENUM('en','zh') | |
| level | VARCHAR(20), NULLABLE | |

### WRITING_SUBMISSIONS
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| user_id | UUID/FK → USERS | |
| prompt_id | UUID/FK → WRITING_PROMPTS | |
| content | TEXT | |
| submitted_at | TIMESTAMP | |

### WRITING_FEEDBACK
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| submission_id | UUID/FK → WRITING_SUBMISSIONS | |
| grammar_score | DECIMAL(5,2) | |
| vocabulary_score | DECIMAL(5,2) | |
| overall_score | DECIMAL(5,2) | |
| detailed_feedback | JSONB | |
| created_at | TIMESTAMP | |

### LEARNING_PROGRESS
*(Tổng hợp tiến trình — TEST-03 nói "lưu lịch sử" nhưng chưa định nghĩa số liệu cụ thể; bảng này đề xuất các chỉ số tối thiểu)*
| Field | Type | Ghi chú |
|---|---|---|
| id | UUID/PK | |
| user_id | UUID/FK → USERS, UNIQUE | 1-1 với User |
| total_flashcards_mastered | INT | |
| total_exercises_completed | INT | |
| streak_days | INT | Số ngày học liên tục |
| last_activity_date | DATE | |
| updated_at | TIMESTAMP | |

---

## 5b. Chính sách lưu trữ file (AWS S3 Free Tier)

AWS Free Tier chuẩn cho S3: 5GB storage, 20.000 GET, 2.000 PUT/tháng (12 tháng đầu). Với quy mô < 50 người dùng, đề xuất giới hạn sau để không vượt free tier:

| Loại file | Giới hạn dung lượng | Bucket/prefix đề xuất | Chính sách xóa |
|---|---|---|---|
| Document (import flashcard: .txt/.csv/.docx) | ≤ 5 MB/file | `s3://.../documents/` | Giữ vĩnh viễn (dung lượng nhỏ) |
| Video upload trực tiếp | ≤ 100 MB/file | `s3://.../videos/` | Giữ vĩnh viễn, có thể Admin xóa thủ công |
| Audio ghi âm luyện nói (SPEAKING_RECORDINGS) | ≤ 2 phút/file (~2-3 MB) | `s3://.../recordings/` | **Auto-delete sau 15 ngày** qua S3 Lifecycle Rule — dùng field `expires_at`, giữ lại `transcript_text` + kết quả phân tích để user vẫn xem lịch sử |
| Avatar user | ≤ 1 MB/file | `s3://.../avatars/` | Ghi đè khi đổi avatar mới |

*Thời hạn 15 ngày cho audio ghi âm nhằm cân bằng giữa trải nghiệm (user xem lại lịch sử luyện nói) và chi phí/privacy.*

Validate dung lượng file nên thực hiện ở cả Frontend (chặn sớm) và Backend (chống bypass).

---

## 6. Bảng tổng hợp quan hệ (Relationship Summary)

| Quan hệ | Loại | Ghi chú |
|---|---|---|
| USERS — FLASHCARD_DECKS | 1–n | owner_id |
| USERS — FLASHCARDS (qua USER_FLASHCARD_PROGRESS) | n–n | có thuộc tính (status, review_count) |
| FLASHCARD_DECKS — FLASHCARDS | 1–n | |
| FLASHCARD_DECKS — DOCUMENTS | n–1 | 1 deck sinh ra từ 1 document (nullable) |
| VIDEOS — SUBTITLES | 1–n | |
| VIDEOS — EXERCISES | 1–n | nullable (exercise reading không có video) |
| EXERCISES — QUESTIONS | 1–n | |
| QUESTIONS — ANSWER_OPTIONS | 1–n | chỉ áp dụng loại multiple_choice |
| USERS — USER_ATTEMPTS | 1–n | |
| USER_ATTEMPTS — USER_ANSWERS | 1–n | |
| USERS — SPEAKING_RECORDINGS | 1–n | |
| SPEAKING_RECORDINGS — SPEAKING_ANALYSIS | 1–1 | |
| USERS — WRITING_SUBMISSIONS | 1–n | |
| WRITING_SUBMISSIONS — WRITING_FEEDBACK | 1–1 | |
| USERS — LEARNING_PROGRESS | 1–1 | |

---

## 7. Quyết định nghiệp vụ (đã chốt) & việc còn lại

**Đã chốt:**
1. ✅ Flashcard deck do user tự tạo, tùy biến hoàn toàn (không cần Admin duyệt).
2. ✅ Cho phép sửa trực tiếp flashcard do AI trích xuất (field `is_edited` để tracking).
3. ✅ Giới hạn dung lượng file — xem bảng mục 5b.
4. ✅ Lưu trữ: AWS S3 (free tier).
5. ✅ SPEAKING_RECORDINGS auto-delete sau **15 ngày** (S3 Lifecycle Rule).
6. ✅ USER_ATTEMPTS cho làm lại nhiều lần, **lưu tất cả lịch sử** (không ghi đè) — model hiện tại (1 user – n attempts) đã hỗ trợ sẵn, không cần đổi.

**Còn cần bạn xác nhận:**
- Nếu lưu tất cả USER_ATTEMPTS, `LEARNING_PROGRESS`/màn hình thống kê nên hiển thị điểm cao nhất, điểm gần nhất, hay trung bình? (không ảnh hưởng schema, chỉ ảnh hưởng logic query/UI).