# API Contract: Vocabulary (Flashcard & Matching)

**Feature**: `001-elearning-platform` | **Module**: VOC-01 → VOC-04

Base URL: `https://api.elearning.app/api`

All endpoints require `Authorization: Bearer <token>` unless noted.

---

## Document Import (VOC-01)

### POST /documents/import
Upload a file (txt/csv/docx) or paste raw text. AI extracts vocabulary into a new deck.

**Request** (multipart/form-data):
- `file` — file blob (≤ 5 MB) OR omit for text paste
- `text_content` — raw text string (used when no file)
- `language` — `en` | `zh`
- `deck_name` — optional; defaults to filename or "Untitled Deck"

**Response** `201 Created`:
```json
{
  "document_id": "<UUID>",
  "deck_id": "<UUID>",
  "deck_name": "My Deck",
  "card_count": 25,
  "language": "en",
  "status": "processing"  // async AI extraction; poll GET /decks/{id} for completion
}
```

**Errors**: `400` (file type not supported), `413` (file > 5 MB), `422` (AI extraction failed)

---

## Flashcard Decks (VOC-04)

### GET /decks
List the authenticated user's own decks + all public decks.

**Query params**: `?language=en|zh&visibility=own|public|all&page=0&size=20`

**Response** `200 OK`:
```json
{
  "total": 10,
  "data": [
    {
      "id": "<UUID>",
      "name": "IELTS Vocabulary",
      "language": "en",
      "is_public": false,
      "card_count": 80,
      "owner_id": "<UUID>",
      "created_at": "..."
    }
  ]
}
```

---

### POST /decks
Create a new empty deck.

**Request**:
```json
{ "name": "HSK 3 Words", "language": "zh", "is_public": false }
```

**Response** `201 Created`: Deck object.

---

### PATCH /decks/{deckId}
Rename or toggle public/private. Owner only (admin can manage any deck).

**Request**:
```json
{ "name": "Updated Name", "is_public": true }
```

**Response** `200 OK`: Updated deck object.

---

### DELETE /decks/{deckId}
Delete a deck and all its flashcards. Owner only.

**Response** `204 No Content`.

---

## Flashcards (VOC-02, VOC-04)

### GET /decks/{deckId}/flashcards
List all cards in a deck.

**Response** `200 OK`:
```json
{
  "deck_id": "<UUID>",
  "language": "zh",
  "cards": [
    {
      "id": "<UUID>",
      "term": "你好",
      "phonetic": "nǐ hǎo",
      "meaning_vi": "Xin chào",
      "example_sentence": "你好，我叫小明。",
      "audio_url": "https://s3.../audio.mp3",
      "is_ai_generated": true,
      "is_edited": false,
      "progress": { "status": "new", "review_count": 0 }
    }
  ]
}
```

---

### POST /decks/{deckId}/flashcards
Manually add a new card to an owned deck.

**Request**:
```json
{
  "term": "学习",
  "phonetic": "xuéxí",
  "meaning_vi": "Học tập",
  "example_sentence": "我每天学习中文。"
}
```

**Response** `201 Created`: Card object with `is_ai_generated: false`.

---

### PATCH /flashcards/{cardId}
Edit any field of a card (owner of the deck only). Sets `is_edited = true`.

**Request** (partial):
```json
{ "meaning_vi": "Chào bạn", "example_sentence": "你好吗？" }
```

**Response** `200 OK`: Updated card object.

---

### DELETE /flashcards/{cardId}
Delete a single card. Owner only.

**Response** `204 No Content`.

---

### PATCH /flashcards/{cardId}/progress
Update review status for the authenticated user.

**Request**:
```json
{ "status": "mastered" }
// status: "new" | "learning" | "mastered"
```

**Response** `200 OK`:
```json
{
  "flashcard_id": "<UUID>",
  "status": "mastered",
  "review_count": 5,
  "last_reviewed_at": "2026-07-16T10:00:00Z"
}
```

---

## Matching Exercise (VOC-03)

### GET /decks/{deckId}/matching
Get a random selection of cards for a matching exercise (default: 10 pairs).

**Query params**: `?count=10`

**Response** `200 OK`:
```json
{
  "deck_id": "<UUID>",
  "pairs": [
    { "card_id": "<UUID>", "term": "你好", "meaning_vi": "Xin chào" }
  ]
}
```

---

### POST /matching/{deckId}/result
Record a completed matching exercise result.

**Request**:
```json
{ "score": 8, "time_taken_seconds": 43 }
```

**Response** `201 Created`:
```json
{
  "id": "<UUID>",
  "deck_id": "<UUID>",
  "score": 8,
  "time_taken_seconds": 43,
  "completed_at": "2026-07-16T10:05:00Z"
}
```
