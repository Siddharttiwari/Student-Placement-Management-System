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
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
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

class RecruitmentRound(models.Model):

    class RoundType(models.TextChoices):
        APTITUDE = "APTITUDE", "Aptitude Test"
        CODING = "CODING", "Coding Assessment"
        TECHNICAL = "TECHNICAL", "Technical Interview"
        HR = "HR", "HR Interview"
        GROUP_DISCUSSION = "GROUP_DISCUSSION", "Group Discussion"
        OTHER = "OTHER", "Other"

    drive = models.ForeignKey(
        PlacementDrive,
        on_delete=models.CASCADE,
        related_name="recruitment_rounds"
    )

    round_number = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    round_name = models.CharField(max_length=150)

    round_type = models.CharField(
        max_length=20,
        choices=RoundType.choices,
        default=RoundType.OTHER
    )

    description = models.TextField(
        blank=True
    )

    scheduled_date = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["round_number"]

        constraints = [
            models.UniqueConstraint(
                fields=["drive", "round_number"],
                name="unique_drive_round_number"
            )
        ]

    def __str__(self):
        return (
            f"{self.drive.job_title} - "
            f"Round {self.round_number}: {self.round_name}"
        )


class StudentRoundResult(models.Model):

    class Result(models.TextChoices):
        PENDING = "PENDING", "Pending"
        QUALIFIED = "QUALIFIED", "Qualified"
        REJECTED = "REJECTED", "Rejected"

    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name="round_results"
    )

    round = models.ForeignKey(
        RecruitmentRound,
        on_delete=models.PROTECT,
        related_name="student_results"
    )

    result = models.CharField(
        max_length=15,
        choices=Result.choices,
        default=Result.PENDING
    )

    remarks = models.TextField(
        blank=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["round__round_number"]

        constraints = [
            models.UniqueConstraint(
                fields=["application", "round"],
                name="unique_application_round_result"
            )
        ]

    def __str__(self):
        return (
            f"{self.application.student.full_name} - "
            f"{self.round.round_name} - {self.result}"
        )
