# Duplicate Student Code Validation Design

**Goal:** Prevent duplicate `studentCode` values during student registration with inline async validation on blur.

**Architecture:** Add a dedicated backend check endpoint + `unique=True` on the model + async validator in the frontend that runs when the user leaves the `studentCode` field. All three layers (DB, backend API, frontend) enforce the constraint.

**Tech Stack:** Django REST Framework (backend), React + Mantine v8 (frontend)

---

## Backend

### Model change
- `Student.studentCode`: add `unique=True`
- Generate new migration

### New endpoint: `GET /api/check-student-code/`
- Query param: `code` (string)
- Returns `{"exists": true}` if a student with that code exists, `{"exists": false}` otherwise
- New view function `check_student_code` in `api/views.py`
- New URL pattern in `api/urls.py`

### Create safety net
- In `StudentView.create()`, catch `IntegrityError` from the unique constraint
- Return 400 with a clear error message as fallback

## Frontend

### `RegisterStudentForm.jsx` changes
- Make `validate.studentCode` an async function:
  1. Run existing length check first (synchronous)
  2. If length passes, call `fetch(apiUrl('/api/check-student-code/?code=' + encodeURIComponent(value)))`
  3. If `data.exists` is true, return `'Student code already exists'`; else return `null`
- Add `validateInputOnBlur: ['studentCode']` to `useForm` config so the async validator fires when the field loses focus

## Files modified

| File | Change |
|------|--------|
| `backend/api/models.py` | Add `unique=True` to `studentCode` |
| `backend/api/views.py` | Add `check_student_code` view |
| `backend/api/urls.py` | Add URL pattern for new endpoint |
| `backend/api/migrations/` | New auto-generated migration |
| `frontend/src/Components/RegisterStudentForm.jsx` | Async validator + `validateInputOnBlur` |
