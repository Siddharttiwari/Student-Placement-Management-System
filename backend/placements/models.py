from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings

from companies.models import Company


class PlacementDrive(models.Model):

    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        OPEN = "OPEN", "Open"
        CLOSED = "CLOSED", "Closed"

    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="placement_drives"
    )

    job_title = models.CharField(max_length=150)

    job_description = models.TextField()

    job_location = models.CharField(max_length=150)

    package_lpa = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    minimum_cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(10)
        ]
    )

    eligible_courses = models.CharField(
        max_length=255,
        help_text="Comma-separated courses, e.g. MCA,BCA,B.Tech"
    )

    application_deadline = models.DateField()

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.UPCOMING
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company.name} - {self.job_title}"


class JobApplication(models.Model):

    class Status(models.TextChoices):
        APPLIED = "APPLIED", "Applied"
        SHORTLISTED = "SHORTLISTED", "Shortlisted"
        REJECTED = "REJECTED", "Rejected"
        SELECTED = "SELECTED", "Selected"

    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.PROTECT,
        related_name="job_applications"
    )

    drive = models.ForeignKey(
        PlacementDrive,
        on_delete=models.PROTECT,
        related_name="applications"
    )

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.APPLIED
    )

    applied_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-applied_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["student", "drive"],
                name="unique_student_drive_application"
            )
        ]

    def __str__(self):
        return (
            f"{self.student.full_name} - "
            f"{self.drive.job_title} - "
            f"{self.status}"
        )
