from django.db import models
from django.conf import settings


class StudentProfile(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )

    roll_number = models.CharField(
        max_length=30,
        unique=True
    )

    full_name = models.CharField(max_length=150)

    course = models.CharField(max_length=100)

    branch = models.CharField(max_length=100)

    cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2
    )

    graduation_year = models.PositiveIntegerField()

    phone_number = models.CharField(max_length=15)

    resume = models.FileField(
        upload_to='resumes/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.full_name} - {self.roll_number}"
