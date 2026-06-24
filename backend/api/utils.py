import logging
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO

import cv2
import numpy as np
import qrcode
import qrcode.constants
from django.conf import settings
from django.core.files import File
from django.core.mail import EmailMessage
from django.utils import timezone
from ultralytics import YOLO

from .models import StudentLogs


logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "UniformDetectionModelV3.pt")
CONFIDENCE_THRESHOLD = 0.55
COMPLETE_UNIFORM_THRESHOLD = 0.80
UNIFORM_PART_THRESHOLD = 0.55
_UNIFORM_MODEL = None
_MODEL_LOCK = threading.Lock()
_INFERENCE_LOCK = threading.Lock()
_EMAIL_EXECUTOR = ThreadPoolExecutor(max_workers=2)



def generate_and_save_qr_to_model(data, instance,student):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    email = EmailMessage(
        subject='Uniform Scanner Result',
        body=f'An Account has been created for you with the following details:\n\n'
             f'name: {student.firstName} {student.middleInitial}. {student.lastName}\n'
             f'Email: {student.email}\n\n'
             f'Please use the QR code attached to this email for your attendance.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.EMAIL_HOST_USER, student.email],
    )
    email.attach('qr_code.png', buffer.read(), 'image/png')

    email.send()
    buffer.seek(0)
    instance.qr_code.save(f"{data}.png", File(buffer), save=False)
    
    
def qr_scanner(img_file):
    # Convert Django's InMemoryUploadedFile to a format OpenCV can read
    img_array = np.frombuffer(img_file.read(), np.uint8)
    image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    if image is None:
        return None
    
    qr_det = cv2.QRCodeDetector()
    decoded, _, _ = qr_det.detectAndDecode(image)
    
    return decoded


def get_uniform_model():
    global _UNIFORM_MODEL

    if _UNIFORM_MODEL is None:
        with _MODEL_LOCK:
            if _UNIFORM_MODEL is None:
                _UNIFORM_MODEL = YOLO(MODEL_PATH)

    return _UNIFORM_MODEL


def _send_email_async(subject, body, recipients, attachment_bytes=None):
    def _send():
        try:
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
            )

            if attachment_bytes is not None:
                email.attach('detected.jpg', attachment_bytes, 'image/jpeg')

            email.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send uniform scan email")

    _EMAIL_EXECUTOR.submit(_send)


def _build_scan_message(status, rule_details=None):
    if status == "complete_uniform":
        if rule_details:
            return f"Complete uniform detected. {rule_details}"
        return "Complete uniform detected. Student may proceed."
    if status == "improper_uniform":
        if rule_details:
            return f"Improper uniform detected. {rule_details}"
        return "Improper uniform detected. Please review the highlighted items."
    if rule_details:
        return f"Uniform could not be verified. {rule_details}"
    return "Uniform could not be verified. Please rescan with the student centered, well lit, and both top and pants visible."


def _build_scan_details(detected_objects):
    if not detected_objects:
        return "No confident uniform-related objects were detected in the scan."

    return "\n".join(
        f"- {obj['label']} at {obj['bbox']}" for obj in detected_objects
    )


def _best_detection_for_class(detected_objects, class_name):
    class_detections = [
        obj for obj in detected_objects if obj["class_name"] == class_name
    ]

    if not class_detections:
        return None

    return max(class_detections, key=lambda obj: obj["confidence"])


def _format_detection_line(label, detected, accepted, confidence, threshold):
    if confidence is None:
        return f"{label}: not detected"

    status = "accepted" if accepted else "detected but below required confidence"
    return f"{label}: {status} ({confidence * 100:.0f}%, required {threshold * 100:.0f}%)"


def _build_rule_details(rule_summary):
    return " ".join([
        _format_detection_line(
            "Upper uniform",
            rule_summary["detectedUniformTop"],
            rule_summary["hasUniformTop"],
            rule_summary["uniformTopConfidence"],
            UNIFORM_PART_THRESHOLD,
        ),
        _format_detection_line(
            "Lower uniform",
            rule_summary["detectedUniformPants"],
            rule_summary["hasUniformPants"],
            rule_summary["uniformPantsConfidence"],
            UNIFORM_PART_THRESHOLD,
        ),
        _format_detection_line(
            "Whole uniform",
            rule_summary["detectedCompleteUniform"],
            rule_summary["hasCompleteUniform"],
            rule_summary["completeUniformConfidence"],
            COMPLETE_UNIFORM_THRESHOLD,
        ),
        f"Rule used: {rule_summary['ruleUsed']}.",
    ])


def _determine_scan_status(detected_objects):
    if not detected_objects:
        rule_summary = {
            "detectedCompleteUniform": False,
            "detectedUniformTop": False,
            "detectedUniformPants": False,
            "hasCompleteUniform": False,
            "hasUniformTop": False,
            "hasUniformPants": False,
            "completeUniformConfidence": None,
            "uniformTopConfidence": None,
            "uniformPantsConfidence": None,
            "ruleUsed": "No confident detections",
        }
        return (
            "uncertain",
            "Needs Rescan",
            None,
            "No confident uniform-related objects were detected.",
            rule_summary,
        )

    complete_uniform = _best_detection_for_class(detected_objects, "CompleteUniform")
    uniform_top = _best_detection_for_class(detected_objects, "UniformTop")
    uniform_pants = _best_detection_for_class(detected_objects, "UniformPants")

    complete_confidence = (
        complete_uniform["confidence"] if complete_uniform is not None else None
    )
    top_confidence = uniform_top["confidence"] if uniform_top is not None else None
    pants_confidence = uniform_pants["confidence"] if uniform_pants is not None else None

    has_high_complete_uniform = (
        complete_confidence is not None
        and complete_confidence >= COMPLETE_UNIFORM_THRESHOLD
    )
    has_uniform_top = (
        top_confidence is not None and top_confidence >= UNIFORM_PART_THRESHOLD
    )
    has_uniform_pants = (
        pants_confidence is not None and pants_confidence >= UNIFORM_PART_THRESHOLD
    )
    has_both_uniform_parts = has_uniform_top and has_uniform_pants

    rule_summary = {
        "detectedCompleteUniform": complete_confidence is not None,
        "detectedUniformTop": top_confidence is not None,
        "detectedUniformPants": pants_confidence is not None,
        "hasCompleteUniform": has_high_complete_uniform,
        "hasUniformTop": has_uniform_top,
        "hasUniformPants": has_uniform_pants,
        "completeUniformConfidence": complete_confidence,
        "uniformTopConfidence": top_confidence,
        "uniformPantsConfidence": pants_confidence,
        "ruleUsed": "None",
    }

    if has_high_complete_uniform:
        rule_summary["ruleUsed"] = "Hybrid rule: whole-uniform confidence is very high"
        return (
            "complete_uniform",
            "Complete Uniform",
            "CU",
            _build_rule_details(rule_summary),
            rule_summary,
        )

    if has_both_uniform_parts:
        rule_summary["ruleUsed"] = "Hybrid rule: both upper and lower uniform were detected"
        return (
            "complete_uniform",
            "Complete Uniform",
            "CU",
            _build_rule_details(rule_summary),
            rule_summary,
        )

    missing_parts = []
    if not has_uniform_top:
        missing_parts.append("upper uniform")
    if not has_uniform_pants:
        missing_parts.append("lower uniform")

    complete_text = (
        f" Whole-uniform confidence was {complete_confidence * 100:.0f}%, below the required {COMPLETE_UNIFORM_THRESHOLD * 100:.0f}%."
        if complete_confidence is not None
        else " No whole-uniform detection was found."
    )

    rule_summary["ruleUsed"] = "Hybrid rule failed: need very high whole-uniform confidence or both upper and lower uniform detections"

    return (
        "improper_uniform",
        "Improper Uniform",
        "IU",
        f"Missing or low-confidence detection for {', '.join(missing_parts)}.{complete_text} {_build_rule_details(rule_summary)}",
        rule_summary,
    )

def uniform_scanner(img_file,student):
    img_file.seek(0)
    img_array = np.frombuffer(img_file.read(), np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if frame is None:
        logger.warning("Failed to decode uploaded uniform scan image")
        return {
            "success": False,
            "error": "Failed to load image.",
            "frame": None,
        }

    model = get_uniform_model()
    with _INFERENCE_LOCK:
        results = model(frame, verbose=False)[0]

    detected_objects = []
    
    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        class_name = model.names[cls]

        if conf < CONFIDENCE_THRESHOLD:
            continue

        label = f'{class_name} {conf:.2f}'
        
        detected_objects.append({
            "bbox": [x1, y1, x2, y2],
            "confidence": conf,
            "class_id": cls,
            "class_name": class_name,
            "label": label,
        })

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, label, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    detected_objects.sort(key=lambda obj: obj["confidence"], reverse=True)
    best_detection = detected_objects[0] if detected_objects else None
    status, status_label, log_type, rule_details, rule_summary = _determine_scan_status(detected_objects)
    message = _build_scan_message(status, rule_details)

    if log_type is not None:
        StudentLogs.objects.create(
            student=student,
            log_type=log_type,
            timestamp=timezone.now()
        )

    _, jpeg = cv2.imencode('.jpg', frame)
    jpeg_bytes = jpeg.tobytes()
    object_summary = _build_scan_details(detected_objects)

    email_body = (
        f"Dear {student.fullName},\n\n"
        f"This is to inform you that your recent scan has been processed.\n\n"
        f"Detection Result: {status_label}\n"
        f"Message: {message}\n"
        f"Confidence Threshold: {CONFIDENCE_THRESHOLD:.2f}\n\n"
        f"Details:\n{object_summary}\n\n"
        f"If this detection appears incorrect, please contact your supervisor.\n\n"
        f"Regards,\nUniform Monitoring System"
    )

    _send_email_async(
        subject='[Uniform Scanner] Detection Summary',
        body=email_body,
        recipients=[settings.EMAIL_HOST_USER, student.email],
        attachment_bytes=jpeg_bytes,
    )

    return {
        "success": True,
        "frame": frame,
        "status": status,
        "statusLabel": status_label,
        "message": message,
        "detectedObjects": detected_objects,
        "bestDetection": best_detection,
        "ruleSummary": rule_summary,
        "confidenceThreshold": CONFIDENCE_THRESHOLD,
        "shouldAdvance": status != "uncertain",
    }

    
