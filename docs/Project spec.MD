# PROJECT SPECIFICATION
## Website Học Tiếng Anh & Tiếng Trung Trực Tuyến (English & Chinese E-Learning Platform)

> Tài liệu này tổng hợp toàn bộ đặc tả nghiệp vụ, mô hình dữ liệu, và các quyết định kỹ thuật đã chốt, dùng làm nguồn input duy nhất (single source of truth) cho AI coding agent khi build ứng dụng. Agent nên đọc toàn bộ tài liệu này trước khi sinh code, và tuân thủ nghiêm ngặt các ràng buộc/quyết định đã nêu — không tự ý thay đổi trừ khi có yêu cầu mới từ người dùng.

---

## 0. MỤC LỤC

1. Tổng quan hệ thống & Actor
2. Đặc tả chức năng chi tiết (Functional Requirements)
3. Yêu cầu phi chức năng (Non-Functional Requirements)
4. Tech stack & kiến trúc triển khai
5. Mô hình dữ liệu (Data Dictionary) — tóm tắt, chi tiết xem `schema.sql`
6. Quyết định nghiệp vụ đã chốt (Business Rules)
7. Chính sách lưu trữ file (AWS S3)
8. Yêu cầu riêng cho hỗ trợ tiếng Trung
9. Gợi ý thứ tự triển khai (Implementation Roadmap)
10. Định nghĩa "Hoàn thành" (Definition of Done) cho từng module

---

## 1. TỔNG QUAN HỆ THỐNG & ACTOR

Hệ thống gồm 2 nhóm người dùng:

| Actor | Mô tả |
|---|---|
| **Student (Học viên)** | Học tập, luyện tập 4 kỹ năng (Nghe, Nói, Đọc, Viết) bằng tiếng Anh hoặc tiếng Trung; tự quản lý bộ flashcard riêng; theo dõi tiến trình cá nhân |
| **Admin (Quản trị viên)** | Quản lý tài khoản người dùng, tạo/quản lý nội dung học liệu dùng chung (video, bài test, deck công khai), theo dõi hoạt động hệ thống |

Ứng dụng là **song ngữ nội dung học** (bilingual content): mọi phân hệ học tập (Flashcard, Nghe, Nói, Đọc, Viết) đều phải hỗ trợ đồng thời tiếng Anh và tiếng Trung, phân biệt qua field `language` (`en` | `zh`). Xem mục 8 để biết các yêu cầu riêng cho tiếng Trung.

---

## 2. ĐẶC TẢ CHỨC NĂNG CHI TIẾT

### 2.1 Phân hệ Xác thực & Quản lý người dùng

| Mã | Chức năng | Mô tả |
|---|---|---|
| AUTH-01 | Đăng ký / Đăng nhập | Đăng ký bằng Email hoặc SĐT; đăng nhập Email + mật khẩu; quên mật khẩu qua OTP/link reset gửi Email |
| AUTH-02 | Quản lý phiên đăng nhập | JWT (JSON Web Token), access token + refresh token |
| ADM-01 | Quản trị người dùng | Admin xem danh sách (tìm kiếm, phân trang), khóa/mở khóa tài khoản, phân quyền (student/admin) |

### 2.2 Phân hệ Từ vựng (Flashcard & Word Matching)

| Mã | Chức năng | Mô tả |
|---|---|---|
| VOC-01 | Import tài liệu tạo Flashcard | Upload/dán file (.txt/.csv/.docx hoặc văn bản thô). AI tự động trích xuất: Từ gốc + Phiên âm (IPA/Pinyin) + Nghĩa tiếng Việt + Câu ví dụ |
| VOC-02 | Học từ vựng qua Flashcard | Thẻ 2 mặt (mặt trước: từ/phiên âm; mặt sau: nghĩa/ví dụ/audio phát âm). Lật thẻ, đánh dấu "Đã thuộc"/"Cần học lại" |
| VOC-03 | Check từ ngữ (Matching 2 cột) | 2 cột song song (A: Anh/Trung, B: Việt). Kéo-thả hoặc click ghép cặp, chấm điểm + thời gian realtime |
| VOC-04 | Quản lý Deck cá nhân | User tạo/sửa/xóa deck của riêng mình, đổi tên, bật/tắt public. Sửa trực tiếp nội dung flashcard kể cả khi do AI trích xuất (đánh dấu `is_edited`) |

**Ràng buộc quan trọng**: User được toàn quyền tùy biến deck của mình, không cần Admin duyệt trước khi sử dụng hoặc public.

### 2.3 Phân hệ Luyện Nghe qua Video & Audio (Listening)

| Mã | Chức năng | Mô tả |
|---|---|---|
| LIS-01 | Xem video luyện nghe | Nhúng video (YouTube hoặc upload trực tiếp S3). Phụ đề song ngữ (gốc Anh/Trung - Việt) chạy đồng bộ theo timestamp. Click từ trong phụ đề để tra nghĩa nhanh |
| LIS-02 | Bài tập nghe hiểu | Dạng 1: trắc nghiệm (multiple choice). Dạng 2: điền từ còn thiếu (fill in the blanks) |

### 2.4 Phân hệ Luyện Nói & AI (Speaking)

| Mã | Chức năng | Mô tả |
|---|---|---|
| SPEAK-01 | Thu âm giọng nói | Thu âm qua Microphone (Web Speech API / MediaRecorder), giới hạn 2 phút/lần |
| SPEAK-02 | AI phân tích ngữ pháp & phát âm | (1) Speech-to-Text; (2) Phân tích cấu trúc câu, chỉ lỗi ngữ pháp, gợi ý cấu trúc chuẩn; (3) Chấm điểm phát âm, phát hiện từ/âm/thanh điệu sai |

### 2.5 Phân hệ Kiểm tra & Đánh giá 4 kỹ năng (Test)

| Mã | Chức năng | Mô tả |
|---|---|---|
| TEST-01 | Kiểm tra Đọc hiểu (Reading) | Đọc đoạn văn (Anh/Trung), trả lời trắc nghiệm; kiểm tra từ vựng/ngữ pháp theo ngữ cảnh |
| TEST-02 | Kiểm tra Viết (Writing) | Viết đoạn văn theo đề bài. AI nhận xét ngữ pháp, từ vựng, style, chấm điểm chi tiết |
| TEST-03 | Tổng hợp kết quả & Tiến trình | Báo cáo điểm sau mỗi bài test, lưu **toàn bộ lịch sử** các lần làm (không ghi đè), cho phép làm lại không giới hạn số lần |

---

## 3. YÊU CẦU PHI CHỨC NĂNG

- **Hiệu năng**: API thông thường phản hồi < 500ms; xử lý AI (STT & phân tích ngữ pháp) trả kết quả trong 2–5 giây.
- **UI/UX**: Responsive (desktop + mobile), giao diện tối giản, tập trung trải nghiệm gõ/nghe/nói.
- **Bảo mật**: Mật khẩu mã hóa BCrypt; API bảo vệ bằng JWT Bearer Token; validate dung lượng file ở cả Frontend và Backend (chống bypass).
- **Giới hạn dung lượng file** (xem chi tiết mục 7): Document ≤ 5MB, Video ≤ 100MB, Audio ghi âm ≤ 2 phút (~2-3MB), Avatar ≤ 1MB.
- **Khả năng mở rộng ngôn ngữ**: Kiến trúc dữ liệu (enum `content_language`) phải dễ mở rộng thêm ngôn ngữ thứ 3 trong tương lai mà không cần đổi cấu trúc bảng.

---

## 4. TECH STACK & KIẾN TRÚC TRIỂN KHAI

| Layer | Công nghệ |
|---|---|
| Frontend | React.js + TailwindCSS (hoặc Ant Design), Axios, Web Speech API |
| Backend | Java Spring Boot (RESTful API, Spring Security, Spring Data JPA) **hoặc** Node.js Express — chọn 1, khuyến nghị theo năng lực team |
| Database | PostgreSQL (xem `schema.sql` — đã viết sẵn DDL đầy đủ) |
| AI Integration | Speech-to-Text: OpenAI Whisper API hoặc Web Speech API (free, tích hợp trình duyệt). Phân tích ngữ pháp/viết: Gemini API hoặc OpenAI GPT-4o-mini |
| File Storage | AWS S3 (Free Tier) — xem mục 7 |
| Containerization | Docker |
| Triển khai chi phí thấp | Option A: AWS Free Tier (EC2 t3.micro + RDS db.t3.micro). Option B: Render/Koyeb (Backend Docker) + Supabase/Neon (PostgreSQL) + Vercel (Frontend) |

**File nguồn schema đính kèm**: `schema.sql` — chứa toàn bộ `CREATE TABLE`, enum types, constraints, indexes, triggers. Agent nên chạy trực tiếp file này để khởi tạo database, không tự sinh lại schema từ đầu.

---

## 5. MÔ HÌNH DỮ LIỆU (TÓM TẮT)

> Chi tiết đầy đủ từng field/type nằm trong `schema.sql`. Phần này chỉ liệt kê danh sách bảng và mục đích, để agent định hướng nhanh trước khi đọc DDL.

| Bảng | Mục đích |
|---|---|
| `users` | Tài khoản người dùng (student/admin) |
| `password_reset_tokens` | OTP reset mật khẩu |
| `documents` | File nguồn upload để trích xuất flashcard |
| `flashcard_decks` | Bộ flashcard (do user hoặc admin tạo) |
| `flashcards` | Từng thẻ từ vựng |
| `user_flashcard_progress` | Trạng thái học của từng user với từng flashcard (n-n) |
| `matching_results` | Kết quả bài luyện ghép cột (VOC-03) |
| `videos` | Video luyện nghe |
| `subtitles` | Phụ đề đồng bộ theo timestamp |
| `exercises` | Bài tập (dùng chung Listening + Reading) |
| `questions` | Câu hỏi trong bài tập |
| `answer_options` | Đáp án trắc nghiệm |
| `user_attempts` | Mỗi lượt làm bài (lưu toàn bộ lịch sử) |
| `user_answers` | Câu trả lời chi tiết của từng lượt làm |
| `speaking_recordings` | Bản ghi âm luyện nói (auto-delete sau 15 ngày) |
| `speaking_analysis` | Kết quả AI phân tích giọng nói |
| `writing_prompts` | Đề bài luyện viết |
| `writing_submissions` | Bài viết của user |
| `writing_feedback` | Kết quả AI chấm bài viết |
| `learning_progress` | Thống kê tổng hợp tiến trình học (1-1 với user) |

Quan hệ chính: xem sơ đồ ERD đã thống nhất trong buổi thiết kế trước (19 bảng, khóa ngoại rõ ràng, không có bảng nào đứng độc lập ngoài `writing_prompts`).

---

## 6. QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ CHỐT (Business Rules)

Agent phải tuân thủ đúng các quyết định sau, không tự suy diễn khác:

1. **Sở hữu Flashcard Deck**: User tạo deck của riêng mình, toàn quyền tùy biến (đổi tên, thêm/sửa/xóa card, bật/tắt public), không cần Admin duyệt.
2. **Sửa flashcard AI-generated**: Cho phép sửa trực tiếp trên bản ghi gốc (không tạo bản sao), đánh dấu `is_edited = true` khi có chỉnh sửa từ user.
3. **Giới hạn dung lượng file**: Document ≤ 5MB, Video ≤ 100MB, Audio ghi âm ≤ 2 phút, Avatar ≤ 1MB. Validate cả FE lẫn BE.
4. **Lưu trữ file**: AWS S3 Free Tier. Bucket/prefix tách theo loại: `documents/`, `videos/`, `recordings/`, `avatars/`.
5. **Retention audio ghi âm**: Auto-delete file audio khỏi S3 sau **15 ngày** (S3 Lifecycle Rule dựa trên cột `expires_at`). Giữ lại `transcript_text` và kết quả `speaking_analysis` vĩnh viễn để user vẫn xem lại lịch sử luyện nói (chỉ mất file âm thanh gốc).
6. **Làm lại bài test**: Không giới hạn số lần làm lại; **lưu toàn bộ lịch sử** mỗi lượt làm vào `user_attempts` (không ghi đè kết quả cũ).
7. **Hiển thị điểm ở trang thống kê**: *(Chưa chốt cuối cùng — mặc định đề xuất hiển thị điểm cao nhất kèm điểm lần gần nhất; nếu cần đổi, chỉ ảnh hưởng logic query, không ảnh hưởng schema.)*

---

## 7. CHÍNH SÁCH LƯU TRỮ FILE (AWS S3)

AWS Free Tier chuẩn: 5GB storage, 20.000 GET, 2.000 PUT/tháng (12 tháng đầu).

| Loại file | Giới hạn | Bucket prefix | Chính sách xóa |
|---|---|---|---|
| Document import flashcard | ≤ 5MB | `documents/` | Giữ vĩnh viễn |
| Video upload | ≤ 100MB | `videos/` | Giữ vĩnh viễn (Admin xóa thủ công nếu cần) |
| Audio ghi âm luyện nói | ≤ 2 phút (~2-3MB) | `recordings/` | **Auto-delete sau 15 ngày** (S3 Lifecycle Rule + field `expires_at`) |
| Avatar | ≤ 1MB | `avatars/` | Ghi đè khi đổi avatar mới |

Agent cần implement: (a) validate dung lượng trước khi generate pre-signed URL upload lên S3, (b) 1 cron job/Lambda quét `speaking_recordings.expires_at` để đồng bộ trạng thái `is_deleted` sau khi S3 Lifecycle Rule xóa vật lý file.

---

## 8. YÊU CẦU RIÊNG CHO HỖ TRỢ TIẾNG TRUNG

Đây là điểm khác biệt quan trọng so với một ứng dụng chỉ học tiếng Anh — agent cần chú ý các điểm sau khi code:

- **Database encoding**: Bắt buộc UTF8. Khi tạo DB, khuyến nghị collation `zh_CN.utf8` nếu server hỗ trợ, để sắp xếp/tìm kiếm Hán tự đúng (nếu không có sẵn, `en_US.utf8` vẫn lưu/hiển thị Hán tự đúng vì UTF8 hỗ trợ toàn bộ Unicode, chỉ ORDER BY có thể không tối ưu).
- **Phonetic field**: Với tiếng Trung, cột `phonetic` lưu **Pinyin có dấu thanh điệu** (vd: `nǐ hǎo`, không phải `ni hao` không dấu) — cần font/input hỗ trợ đúng ký tự Unicode thanh điệu.
- **Level tiếng Trung**: Field `exercises.level` / `writing_prompts.level` nên dùng thang **HSK 1–6** cho tiếng Trung thay vì A1-C2 như tiếng Anh — cần UI cho phép chọn thang phù hợp theo `language`.
- **Speaking AI cho tiếng Trung**: Việc chấm phát âm tiếng Trung phải chấm cả **thanh điệu** (tone), không chỉ nguyên âm/phụ âm như tiếng Anh — cần chọn AI model/API có hỗ trợ tone detection (Whisper hỗ trợ tiếng Trung nhưng không tự chấm tone; có thể cần thêm bước xử lý riêng hoặc dùng API chuyên biệt).
- **Font hiển thị**: Frontend cần đảm bảo font hiển thị chữ Hán đầy đủ (không bị tofu box □), khuyến nghị load Noto Sans SC hoặc tương đương.
- **Input method**: Với các trường Admin nhập liệu thủ công (writing prompt, câu hỏi), cần đảm bảo form input hỗ trợ gõ tiếng Trung (IME) không bị lỗi encoding khi submit.
- **Word Matching (VOC-03)**: Với tiếng Trung, cột A hiển thị chữ Hán — cần đảm bảo kích thước font đủ lớn để phân biệt các chữ Hán gần giống nhau, tránh gây nhầm lẫn khi kéo-thả.

---

## 9. GỢI Ý THỨ TỰ TRIỂN KHAI (Implementation Roadmap)

1. **Sprint 0 — Nền tảng**: Setup project (BE + FE + DB), chạy `schema.sql`, cấu hình S3 bucket + IAM policy, setup JWT auth (AUTH-01, AUTH-02).
2. **Sprint 1 — Quản trị & Từ vựng**: ADM-01, VOC-01 → VOC-04 (module nhiều entity nhất, làm sớm để test data pipeline AI-extraction).
3. **Sprint 2 — Nghe**: LIS-01, LIS-02 (video + subtitle sync là phần UI phức tạp nhất, cần ưu tiên thời gian).
4. **Sprint 3 — Nói & AI**: SPEAK-01, SPEAK-02, tích hợp S3 upload + Lifecycle Rule cho recordings.
5. **Sprint 4 — Đọc & Viết**: TEST-01, TEST-02.
6. **Sprint 5 — Tổng hợp & Polish**: TEST-03 (dashboard tiến trình), responsive UI, tối ưu hiệu năng, hardening bảo mật.

---

## 10. ĐỊNH NGHĨA "HOÀN THÀNH" (Definition of Done)

Một module được coi là hoàn thành khi:
- [ ] Toàn bộ chức năng trong bảng đặc tả (mục 2) hoạt động đúng cho **cả 2 ngôn ngữ** (Anh + Trung), không chỉ test với tiếng Anh.
- [ ] API endpoint có validate input, trả lỗi rõ ràng, tuân thủ giới hạn dung lượng file (mục 7).
- [ ] Dữ liệu ghi đúng theo schema trong `schema.sql`, không tạo bảng/cột ngoài spec mà không cập nhật tài liệu.
- [ ] UI responsive, hiển thị đúng font Hán tự, không có tofu box.
- [ ] Có unit test/integration test tối thiểu cho business logic quan trọng (chấm điểm, AI parsing, JWT auth).