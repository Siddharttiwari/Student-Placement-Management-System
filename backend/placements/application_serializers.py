
from rest_framework import serializers

from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):

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
            "drive",
            "company_name",
            "job_title",
            "status",
            "applied_at",
            "updated_at",
        ]

        read_only_fields = fields
