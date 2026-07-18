# API Contract: Reading & Progress (TEST-01, TEST-03)

**Feature**: `001-elearning-platform` | **Module**: TEST-01, TEST-03

Base URL: `https://api.elearning.app/api`

---

## Reading Exercises (TEST-01)

Reading exercises use the same `/exercises` endpoints as Listening (see `api-listening.md`), with `skill_type = reading` and `passage_text` instead of `video_id`.

### GET /exercises?skill_type=reading
Filter exercises to reading type.

### GET /exercises/{exerciseId}
For reading exercises, response includes `passage_text` (may contain Hanzi) instead of `video`.

```json
{
  "id": "<UUID>",
  "skill_type": "reading",
  "title": "Climate Change Reading",
  "language": "en",
  "level": "B2",
  "passage_text": "Climate change is one of the most pressing issues...",
  "questions": [ ... ]
}
```

### POST /exercises/{exerciseId}/attempts
Same contract as Listening (see `api-listening.md`). Unlimited re-attempts, all stored.

---

## Progress Dashboard (TEST-03)

### GET /progress
Get the authenticated user's aggregated learning progress.

**Response** `200 OK`:
```json
{
  "user_id": "<UUID>",
  "total_flashcards_mastered": 150,
  "total_exercises_completed": 32,
  "streak_days": 7,
  "last_activity_date": "2026-07-15",
  "updated_at": "2026-07-16T08:00:00Z"
}
```

### GET /exercises/{exerciseId}/attempts
List all past attempts for a specific exercise by the authenticated user. Returns ALL historical rows — UI is responsible for highlighting highest and most recent scores.

**Response** `200 OK`:
```json
[
  { "attempt_id": "<UUID>", "score": 90.00, "completed_at": "2026-07-16T...", "is_highest": true },
  { "attempt_id": "<UUID>", "score": 60.00, "completed_at": "2026-07-14T...", "is_highest": false }
]
```

### GET /progress/history
Get a summary of all exercises the user has attempted, with best and latest score.

**Response** `200 OK`:
```json
[
  {
    "exercise_id": "<UUID>",
    "title": "Business Meeting Comprehension",
    "skill_type": "listening",
    "language": "en",
    "attempt_count": 3,
    "highest_score": 90.00,
    "latest_score": 80.00,
    "last_attempted_at": "2026-07-16T..."
  }
]
```
