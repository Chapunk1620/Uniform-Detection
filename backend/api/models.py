from django.db import models
from django.contrib.auth.models import User


def training_sample_upload_path(instance, filename):
    return f"training_samples/{instance.expected_label}/{filename}"

class Course(models.Model):
    name = models.CharField(max_length=50)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

# Create your models here.
class Student(models.Model):
    firstName = models.CharField(max_length=50)
    middleInitial = models.CharField(max_length=3)
    lastName = models.CharField(max_length=50)
    studentCode = models.CharField()
    email = models.EmailField()
    password = models.CharField(max_length=20)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="students", null=True, blank=True)
    year_level = models.IntegerField()
    update = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)
    role = "Student"
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="studentAccount", null=True, blank=True)
    
    @property
    def fullName(self):
        return f'{self.firstName} {self.middleInitial}. {self.lastName}'

class StudentQR(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="studentQr")
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    
class StudentAttendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance_records")
    uniform = models.CharField(max_length=11, choices=[('Complete', 'Complete'), ('Incomeplete', 'Incomplete')])
    status = models.CharField(max_length=10, choices=[('Present', 'Present'), ('Absent', 'Absent')])
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

class StudentLogs(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="student_logs")
    log_type = models.CharField(max_length=20, choices=[('CU', 'Complete Uniform'), ('IU', 'Incomplete Uniform')])
    timestamp = models.DateTimeField(auto_now_add=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)


class UniformTrainingSample(models.Model):
    expected_label = models.CharField(
        max_length=30,
        choices=[
            ('CompleteUniform', 'Complete Uniform'),
            ('UniformTop', 'Uniform Top'),
            ('UniformPants', 'Uniform Pants'),
            ('NeedsReview', 'Needs Review'),
        ],
    )
    notes = models.TextField(blank=True)
    image = models.ImageField(upload_to=training_sample_upload_path)
    captured_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uniform_training_samples",
    )
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.expected_label} - {self.created.isoformat()}"
