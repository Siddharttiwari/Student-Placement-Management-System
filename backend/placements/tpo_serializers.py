
from rest_framework import serializers

from .models import JobApplication


class TPOApplicationSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True
    )

    roll_number = serializers.CharField(
        source="student.roll_number",
        read_only=True
    )

    course = serializers.CharField(
        source="student.course",
        read_only=True
    )

    cgpa = serializers.DecimalField(
        source="student.cgpa",
        max_digits=4,
        decimal_places=2,
        read_only=True
    )

    company_name = serializers.CharField(
        source="drive.company.name",
        read_only=True
    )

    job_title = serializers.CharField(
        source="drive.job_title",
        read_only=True
    )

    class Meta:
        model = JobApplication

        fields = [
            "id",
            "student_name",
            "roll_number",
            "course",
            "cgpa",
            "company_name",
            "job_title",
            "status",
            "applied_at",
            "updated_at",
        ]

        read_only_fields = fields


class ApplicationStatusSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=[
            "SHORTLISTED",
            "REJECTED",
            "SELECTED",
        ]
    )