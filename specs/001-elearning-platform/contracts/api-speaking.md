# API Contract: Speaking (Recording & AI Analysis)

**Feature**: `001-elearning-platform` | **Module**: SPEAK-01, SPEAK-02

Base URL: `https://api.elearning.app/api`

---

## Speaking Recordings

### POST /recordings/upload-url
Request a pre-signed S3 PUT URL for audio upload. Backend validates size and creates a recording row.

**Request**:
```json
{
  "language": "zh",
  "prompt_text": "请说出这句话：你好，我叫小明。",
  "file_size_bytes": 1500000,
  "duration_seconds": 45
}
```

**Validation**:
- `duration_seconds` MUST be ≤ 120 (2 minutes)
- `file_size_bytes` MUST be ≤ 3145728 (3 MB)

**Response** `200 OK`:
```json
{
  "recording_id": "<UUID>",
  "upload_url": "https://s3.amazonaws.com/elearning/recordings/<UUID>.webm?X-Amz-Signature=...",
  "expires_in": 300
}
```

**Errors**: `400` (duration > 2 min or size > 3 MB)

---

### POST /recordings/{recordingId}/analyze
Trigger STT + AI analysis after the client has uploaded the audio to S3.

**Request**: Empty body (recording_id in path is sufficient).

**Response** `202 Accepted`:
```json
{
  "recording_id": "<UUID>",
  "status": "processing"
}
```

Analysis completes asynchronously (≤ 5 seconds). Poll `GET /recordings/{id}` for results.

---

### GET /recordings/{recordingId}
Get recording details and analysis results.

**Response** `200 OK`:
```json
{
  "id": "<UUID>",
  "language": "zh",
  "prompt_text": "请说出这句话：你好，我叫小明。",
  "audio_url": "https://s3.../recordings/<UUID>.webm",
  "transcript_text": "你好，我叫小明。",
  "created_at": "2026-07-16T10:00:00Z",
  "expires_at": "2026-07-31T10:00:00Z",
  "is_deleted": false,
  "analysis": {
    "pronunciation_score": 78.5,
    "grammar_errors": [
      {
        "error_type": "tone",
        "original": "小",
        "corrected": "xiǎo (3rd tone)",
        "explanation": "Tone 3 was pronounced as Tone 1"
      }
    ],
    "suggestions": [
      { "type": "tone", "text": "Focus on the falling-rising contour of 3rd tone characters." },
      { "type": "fluency", "text": "Slight hesitation between 你好 and 我叫; aim for smoother linking." }
    ]
  }
}
```

When `is_deleted = true`: `audio_url` is null or returns 404, but `transcript_text` and `analysis` remain.

---

### GET /recordings
List the authenticated user's recording history.

**Query params**: `?language=en|zh&page=0&size=20`

**Response** `200 OK`:
```json
{
  "total": 12,
  "data": [
    {
      "id": "<UUID>",
      "language": "zh",
      "prompt_text": "...",
      "transcript_text": "...",
      "pronunciation_score": 78.5,
      "created_at": "...",
      "expires_at": "...",
      "is_deleted": false
    }
  ]
}
```

---

## Internal: S3 Lifecycle Sync (Backend/Lambda)

### PATCH /internal/recordings/{recordingId}/mark-deleted
Called by the backend cron job or AWS Lambda after S3 physically deletes the audio file.

**Auth**: Internal service token (not user-facing).

**Request**: Empty body.

**Response** `200 OK`:
```json
{ "recording_id": "<UUID>", "is_deleted": true }
```

DB effect: `UPDATE speaking_recordings SET is_deleted = true WHERE id = ?`
