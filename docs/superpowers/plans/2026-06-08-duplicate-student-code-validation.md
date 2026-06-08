# Duplicate Student Code Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent duplicate `studentCode` during student registration with async inline validation on blur.

**Architecture:** Add `unique=True` to the `Student.studentCode` model field, create a dedicated `GET /api/check-student-code/` endpoint, add an `IntegrityError` safety net in the create view, and wire up an async validator in the frontend `RegisterStudentForm.jsx` that triggers on blur.

**Tech Stack:** Django 5.2 + DRF 3.16 (backend), React 18 + Mantine v8 (frontend)

---

### Task 1: Add unique constraint to studentCode

**Files:**
- Modify: `backend/api/models.py:21`
- Create: `backend/api/migrations/0003_student_unique_studentcode.py` (auto-generated)

- [ ] **Step 1: Add `unique=True` to studentCode field**

Edit `backend/api/models.py:21`:
```python
# Before:
studentCode = models.CharField()
# After:
studentCode = models.CharField(unique=True)
```

- [ ] **Step 2: Generate migration**

Run:
```powershell
cd backend
python manage.py makemigrations
```
Expected output: `Migrations for 'api': api/migrations/0003_student_unique_studentcode.py`

- [ ] **Step 3: Run migration**

Run:
```powershell
python manage.py migrate
```
Expected output: `Applying api.0003_student_unique_studentcode... OK`

- [ ] **Step 4: Commit**

```bash
git add backend/api/models.py backend/api/migrations/0003_student_unique_studentcode.py
git commit -m "feat: add unique constraint to studentCode field"
```

---

### Task 2: Backend check endpoint

**Files:**
- Modify: `backend/api/views.py`
- Modify: `backend/api/urls.py`
- Modify: `backend/api/tests.py`

- [ ] **Step 1: Write tests for the check endpoint**

Append to `backend/api/tests.py`:
```python
import json
from django.test import TestCase
from django.contrib.auth.models import User
from .models import Student, Course


class CheckStudentCodeTests(TestCase):
    def setUp(self):
        self.course = Course.objects.create(name="BS Computer Science")
        self.user = User.objects.create_user(username="testuser", password="pass1234")
        self.student = Student.objects.create(
            firstName="John",
            middleInitial="D",
            lastName="Doe",
            studentCode="STU-001",
            email="john@example.com",
            password="Password1",
            course=self.course,
            year_level=1,
        )

    def test_existing_code_returns_exists_true(self):
        response = self.client.get("/api/check-student-code/", {"code": "STU-001"})
        data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["exists"])

    def test_nonexistent_code_returns_exists_false(self):
        response = self.client.get("/api/check-student-code/", {"code": "STU-999"})
        data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(data["exists"])

    def test_missing_code_param_returns_400(self):
        response = self.client.get("/api/check-student-code/")
        self.assertEqual(response.status_code, 400)
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```powershell
python manage.py test api.tests.CheckStudentCodeTests -v2
```
Expected: 3 failures — "check_student_code" view not found (404)

- [ ] **Step 3: Implement the check endpoint view**

Add to `backend/api/views.py`:
```python
@api_view(['GET'])
def check_student_code(request):
    code = request.query_params.get("code")
    if not code:
        return Response({"error": "code query parameter is required"}, status=400)
    exists = Student.objects.filter(studentCode=code).exists()
    return Response({"exists": exists})
```

- [ ] **Step 4: Add URL pattern**

Add to `backend/api/urls.py`:
```python
    path('check-student-code/', views.check_student_code),
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```powershell
python manage.py test api.tests.CheckStudentCodeTests -v2
```
Expected: 3 passed (OK)

- [ ] **Step 6: Commit**

```bash
git add backend/api/views.py backend/api/urls.py backend/api/tests.py
git commit -m "feat: add check-student-code endpoint for duplicate detection"
```

---

### Task 3: Backend create safety net

**Files:**
- Modify: `backend/api/views.py:84-104`
- Modify: `backend/api/tests.py`

- [ ] **Step 1: Write test for duplicate create rejection**

Append to `backend/api/tests.py` inside `CheckStudentCodeTests` or as a new class:
```python
from django.db import IntegrityError


class CreateStudentDuplicateTests(TestCase):
    def setUp(self):
        self.course = Course.objects.create(name="BS Computer Science")
        self.user = User.objects.create_user(username="testuser2", password="pass1234")
        self.student = Student.objects.create(
            firstName="John",
            middleInitial="D",
            lastName="Doe",
            studentCode="STU-002",
            email="john@example.com",
            password="Password1",
            course=self.course,
            year_level=1,
        )

    def test_create_duplicate_student_code_returns_400(self):
        payload = {
            "firstName": "Jane",
            "middleInitial": "M",
            "lastName": "Smith",
            "studentCode": "STU-002",
            "email": "jane@example.com",
            "password": "Password1",
            "course": self.course.id,
            "year_level": 2,
        }
        response = self.client.post("/api/students/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("already exists", str(response.content.lower()))
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```powershell
python manage.py test api.tests.CreateStudentDuplicateTests -v2
```
Expected: FAIL — currently returns 500 (IntegrityError unhandled) or 201 (if test user setup issues arise)

- [ ] **Step 3: Add IntegrityError handling in StudentView.create**

Edit `backend/api/views.py:84-104`. Replace the `create` method:
```python
    def create(self, request, *args, **kwargs):
        print("Incoming Data:", request.data)

        course = request.data.get("course")
        print("Course ID:", course)

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation Errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course_obj = get_object_or_404(Course, id=course)

        try:
            student = serializer.save(course=course_obj)
        except IntegrityError:
            return Response(
                {"studentCode": ["A student with this code already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance = StudentQR.objects.create(student=student)
        generate_and_save_qr_to_model(student.studentCode, instance, student)
        instance.save()

        return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)
```

Also add `IntegrityError` import at the top of `views.py`:
```python
from django.db import IntegrityError
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```powershell
python manage.py test api.tests.CreateStudentDuplicateTests -v2
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/api/views.py backend/api/tests.py
git commit -m "feat: handle duplicate studentCode in StudentView.create with IntegrityError catch"
```

---

### Task 4: Frontend async validation

**Files:**
- Modify: `frontend/src/Components/RegisterStudentForm.jsx`

- [ ] **Step 1: Add async validator for studentCode**

Edit `frontend/src/Components/RegisterStudentForm.jsx`:

1. Import `apiUrl` alongside `apiFetch`:
```javascript
import { apiFetch, apiUrl } from "../config/api";
```

2. Change the `studentCode` validator to an async function and add `validateInputOnBlur`:
```javascript
const form = useForm({
    initialValues: {
      firstName: '',
      middleInitial: '',
      lastName: '',
      studentCode: '',
      course: '',
      year_level: '',
      email: '',
      password: '',
    },
    validateInputOnBlur: ['studentCode'],
    validate: {
      firstName: (value) => (value.length < 2 ? 'First name must have at least 2 letters' : null),
      lastName: (value) => (value.length < 2 ? 'Last name must have at least 2 letters' : null),
      studentCode: async (value) => {
        if (value.length < 5) return 'Student code must be at least 5 characters long';
        try {
          const res = await fetch(apiUrl(`/api/check-student-code/?code=${encodeURIComponent(value)}`));
          const data = await res.json();
          return data.exists ? 'Student code already exists' : null;
        } catch {
          return null;
        }
      },
      course: (value) => (value ? null : 'Please select a course'),
      year_level: (value) => (/^[1-5]$/.test(value) ? null : 'Year level must be between 1-5'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) =>
        value.length < 8
          ? 'Password must be at least 8 characters long'
          : !/\d/.test(value)
          ? 'Password must include at least one number'
          : !/[a-z].test(value)
          ? 'Password must include at least one lowercase letter'
          : !/[A-Z].test(value)
          ? 'Password must include at least one uppercase letter'
          : null,
    },
  });
```

- [ ] **Step 2: Verify the frontend builds**

Run:
```powershell
cd frontend
npm run build
```
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/Components/RegisterStudentForm.jsx
git commit -m "feat: add async studentCode duplicate validation on blur"
```
