import json
from django.test import TestCase, SimpleTestCase
from django.contrib.auth.models import User
from .models import Student, Course

from .utils import _determine_scan_status


class UniformScanDecisionTests(SimpleTestCase):
    def _detection(self, class_name, confidence):
        return {
            "class_name": class_name,
            "confidence": confidence,
            "bbox": [0, 0, 100, 100],
            "class_id": 0,
            "label": f"{class_name} {confidence:.2f}",
        }

    def test_high_confidence_complete_uniform_is_accepted_without_parts(self):
        status, status_label, log_type, _, summary = _determine_scan_status([
            self._detection("CompleteUniform", 0.80),
        ])

        self.assertEqual(status, "complete_uniform")
        self.assertEqual(status_label, "Complete Uniform")
        self.assertEqual(log_type, "CU")
        self.assertTrue(summary["hasCompleteUniform"])
        self.assertFalse(summary["hasUniformTop"])
        self.assertFalse(summary["hasUniformPants"])

    def test_low_confidence_complete_uniform_alone_is_improper(self):
        status, status_label, log_type, details, summary = _determine_scan_status([
            self._detection("CompleteUniform", 0.79),
        ])

        self.assertEqual(status, "improper_uniform")
        self.assertEqual(status_label, "Improper Uniform")
        self.assertEqual(log_type, "IU")
        self.assertFalse(summary["hasCompleteUniform"])
        self.assertIn("upper uniform", details)
        self.assertIn("lower uniform", details)

    def test_uniform_top_and_pants_are_accepted_without_complete_uniform(self):
        status, status_label, log_type, _, summary = _determine_scan_status([
            self._detection("UniformTop", 0.55),
            self._detection("UniformPants", 0.56),
        ])

        self.assertEqual(status, "complete_uniform")
        self.assertEqual(status_label, "Complete Uniform")
        self.assertEqual(log_type, "CU")
        self.assertFalse(summary["hasCompleteUniform"])
        self.assertTrue(summary["hasUniformTop"])
        self.assertTrue(summary["hasUniformPants"])

    def test_single_uniform_part_is_improper(self):
        status, status_label, log_type, details, summary = _determine_scan_status([
            self._detection("UniformTop", 0.80),
        ])

        self.assertEqual(status, "improper_uniform")
        self.assertEqual(status_label, "Improper Uniform")
        self.assertEqual(log_type, "IU")
        self.assertTrue(summary["hasUniformTop"])
        self.assertFalse(summary["hasUniformPants"])
        self.assertIn("lower uniform", details)


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
