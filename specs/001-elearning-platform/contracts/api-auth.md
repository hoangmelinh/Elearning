# API Contract: Authentication & Users

**Feature**: `001-elearning-platform` | **Module**: Auth + Admin (AUTH-01, AUTH-02, ADM-01)

Base URL: `https://api.elearning.app/api`

---

## Auth Endpoints

### POST /auth/register
Register a new student account.

**Request**:
```json
{
  "full_name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "Min8Chars1!",
  "phone": "+84901234567"   // optional
}
```

**Response** `201 Created`:
```json
{
  "access_token": "<JWT>",
  "refresh_token": "<UUID>",
  "expires_in": 900
}
```

**Errors**: `400` (validation), `409` (email already registered)

---

### POST /auth/login
Authenticate with email + password.

**Request**:
```json
{ "email": "user@example.com", "password": "Min8Chars1!" }
```

**Response** `200 OK`: Same shape as register.

**Errors**: `401` (invalid credentials), `403` (account locked)

---

### POST /auth/refresh
Exchange a valid refresh token for a new access token.

**Request**:
```json
{ "refresh_token": "<UUID>" }
```

**Response** `200 OK`:
```json
{ "access_token": "<JWT>", "expires_in": 900 }
```

**Errors**: `401` (invalid/expired refresh token)

---

### POST /auth/forgot-password
Send a 6-digit OTP to the user's registered email.

**Request**:
```json
{ "email": "user@example.com" }
```

**Response** `200 OK`: `{ "message": "OTP sent" }` (always — do not reveal if email exists)

---

### POST /auth/reset-password
Verify OTP and set a new password.

**Request**:
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "new_password": "NewPass9!"
}
```

**Response** `200 OK`: `{ "message": "Password reset successful" }`

**Errors**: `400` (OTP expired or already used), `404` (no pending OTP for email)

---

## Admin: User Management Endpoints

> All endpoints below require `Authorization: Bearer <admin_token>` and `role = admin`.

### GET /admin/users
List all users with search + pagination.

**Query params**: `?page=0&size=20&search=<string>&status=active|locked&role=student|admin`

**Response** `200 OK`:
```json
{
  "total": 150,
  "page": 0,
  "size": 20,
  "data": [
    {
      "id": "<UUID>",
      "full_name": "...",
      "email": "...",
      "role": "student",
      "status": "active",
      "created_at": "2026-07-16T10:00:00Z"
    }
  ]
}
```

---

### PATCH /admin/users/{userId}
Update user status or role.

**Request**:
```json
{ "status": "locked" }
// or
{ "role": "admin" }
```

**Response** `200 OK`: Updated user object.

**Errors**: `403` (cannot demote last admin), `404` (user not found)

---

### GET /admin/users/{userId}
Get full user profile.

**Response** `200 OK`: Full user object including `created_at`, `updated_at`, `primary_learning_language`.
