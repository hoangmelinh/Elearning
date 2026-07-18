# API Contract: Listening (Video, Subtitle, Exercise)

**Feature**: `001-elearning-platform` | **Module**: LIS-01, LIS-02

Base URL: `https://api.elearning.app/api`

---

## Videos

### GET /videos
List available videos.

**Query params**: `?language=en|zh&page=0&size=20`

**Response** `200 OK`:
```json
{
  "total": 42,
  "data": [
    {
      "id": "<UUID>",
      "title": "Business English: Meetings",
      "language": "en",
      "source_type": "youtube",
      "video_url": "https://www.youtube.com/embed/...",
      "duration_seconds": 380,
      "created_at": "..."
    }
  ]
}
```

---

### POST /videos *(Admin only)*
Add a YouTube video or request upload URL for direct upload.

**Request (YouTube)**:
```json
{
  "title": "Mandarin Basics Ep.1",
  "language": "zh",
  "source_type": "youtube",
  "video_url": "https://www.youtube.com/embed/<id>",
  "duration_seconds": 600
}
```

**Request (upload — Step 1: get pre-signed URL)**:
```json
{
  "title": "IELTS Listening Practice",
  "language": "en",
  "source_type": "upload",
  "file_size_bytes": 52000000,
  "duration_seconds": 900
}
```

**Response** `201 Created (youtube)**: Video object.

**Response** `200 OK (upload)`:
```json
{
  "video_id": "<UUID>",
  "upload_url": "https://s3.amazonaws.com/...",
  "expires_in": 900
}
```

**Errors**: `400` (file_size_bytes > 100 MB), `403` (not admin)

---

### DELETE /videos/{videoId} *(Admin only)*
Delete video and cascade-delete subtitles and linked exercises.

**Response** `204 No Content`.

---

## Subtitles

### GET /videos/{videoId}/subtitles
Retrieve all subtitle lines for a video (ordered by `order_index`).

**Query params**: `?language=source|vi` (optional filter)

**Response** `200 OK`:
```json
[
  {
    "id": "<UUID>",
    "language": "source",
    "start_time_ms": 0,
    "end_time_ms": 3000,
    "text": "Hello and welcome to today's lesson.",
    "order_index": 1
  },
  {
    "id": "<UUID>",
    "language": "vi",
    "start_time_ms": 0,
    "end_time_ms": 3000,
    "text": "Xin chào và chào mừng đến bài học hôm nay.",
    "order_index": 1
  }
]
```

---

### POST /videos/{videoId}/subtitles/bulk *(Admin only)*
Upload all subtitle lines for one language in bulk (replaces existing rows for that language).

**Request**:
```json
{
  "language": "source",
  "subtitles": [
    { "start_time_ms": 0, "end_time_ms": 3000, "text": "Hello...", "order_index": 1 },
    { "start_time_ms": 3100, "end_time_ms": 6500, "text": "Today we...", "order_index": 2 }
  ]
}
```

**Response** `201 Created**: `{ "inserted": 42 }`

---

## Exercises (Listening — LIS-02)

### GET /exercises
List exercises.

**Query params**: `?skill_type=listening|reading&language=en|zh&page=0&size=20`

**Response** `200 OK`:
```json
{
  "total": 15,
  "data": [
    {
      "id": "<UUID>",
      "skill_type": "listening",
      "title": "Business Meeting Comprehension",
      "language": "en",
      "level": "B2",
      "video_id": "<UUID>",
      "question_count": 5
    }
  ]
}
```

---

### GET /exercises/{exerciseId}
Get full exercise with all questions and answer options.

**Response** `200 OK`:
```json
{
  "id": "<UUID>",
  "skill_type": "listening",
  "title": "...",
  "language": "en",
  "video": { "id": "<UUID>", "video_url": "..." },
  "questions": [
    {
      "id": "<UUID>",
      "question_type": "multiple_choice",
      "question_text": "What is the main topic of the meeting?",
      "order_index": 1,
      "options": [
        { "id": "<UUID>", "option_text": "Budget review" },
        { "id": "<UUID>", "option_text": "Team building" }
      ]
    },
    {
      "id": "<UUID>",
      "question_type": "fill_blank",
      "question_text": "The meeting will take place on ___.",
      "order_index": 2,
      "options": []
    }
  ]
}
```

---

### POST /exercises/{exerciseId}/attempts
Submit a completed exercise attempt.

**Request**:
```json
{
  "answers": [
    { "question_id": "<UUID>", "selected_option_id": "<UUID>" },
    { "question_id": "<UUID>", "answer_text": "Monday" }
  ],
  "started_at": "2026-07-16T10:00:00Z"
}
```

**Response** `201 Created`:
```json
{
  "attempt_id": "<UUID>",
  "exercise_id": "<UUID>",
  "score": 80.00,
  "completed_at": "2026-07-16T10:08:30Z",
  "answers": [
    { "question_id": "<UUID>", "is_correct": true },
    { "question_id": "<UUID>", "is_correct": false, "correct_answer": "Monday" }
  ]
}
```

---

### GET /exercises/{exerciseId}/attempts
Get all past attempts by the authenticated user for this exercise.

**Response** `200 OK`:
```json
[
  {
    "attempt_id": "<UUID>",
    "score": 80.00,
    "started_at": "...",
    "completed_at": "..."
  },
  {
    "attempt_id": "<UUID>",
    "score": 60.00,
    "started_at": "...",
    "completed_at": "..."
  }
]
```

Note: All historical attempts are returned; UI highlights highest and most recent.
