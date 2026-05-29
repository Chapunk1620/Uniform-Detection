from django.test import SimpleTestCase

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
