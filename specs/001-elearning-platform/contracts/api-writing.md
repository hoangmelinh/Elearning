# API Contract: Writing (Prompt, Submission, AI Feedback)

**Feature**: `001-elearning-platform` | **Module**: TEST-02

Base URL: `https://api.elearning.app/api`

---

## Writing Prompts

### GET /writing-prompts
List all writing prompts. Query params: `?language=en|zh&level=B1|HSK4&page=0&size=20`

**Response** `200 OK`: `{ "total": N, "data": [{ "id", "title", "description", "language", "level" }] }`

### POST /writing-prompts *(Admin only)*
**Request**: `{ "title": "...", "description": "...", "language": "en"|"zh", "level": "B1" }`
**Response** `201 Created`: Prompt object.

### DELETE /writing-prompts/{promptId} *(Admin only)*
Cascade-deletes submissions + feedback. **Response** `204 No Content`.

---

## Writing Submissions

### POST /writing-submissions
Submit student essay. AI feedback generated asynchronously (≤ 5 s).

**Request**: `{ "prompt_id": "<UUID>", "content": "Student essay text..." }`

**Response** `201 Created`:
```json
{ "submission_id": "<UUID>", "submitted_at": "...", "feedback_status": "processing" }
```

### GET /writing-submissions/{submissionId}
Get submission with AI feedback (null while processing).

**Response** `200 OK`:
```json
{
  "id": "<UUID>",
  "content": "...",
  "submitted_at": "...",
  "feedback": {
    "grammar_score": 82.0,
    "vocabulary_score": 75.5,
    "overall_score": 79.0,
    "detailed_feedback": {
      "summary": "Good effort!",
      "errors": [{ "type": "grammar", "original": "I wakes", "corrected": "I wake", "explanation": "..." }],
      "vocabulary_suggestions": ["Consider replacing 'good' with 'excellent'."]
    }
  }
}
```

### GET /writing-submissions
List all submissions by the authenticated user. Query: `?language=en|zh&page=0&size=20`
