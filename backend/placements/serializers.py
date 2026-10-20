from django.utils import timezone
from rest_framework import serializers

from .models import PlacementDrive


class PlacementDriveSerializer(serializers.ModelSerializer):

    company_name = serializers.CharField(
        source="company.name",
        read_only=True
    )

    class Meta:
        model = PlacementDrive

        fields = [
            "id",
            "company",
            "company_name",
            "job_title",
            "job_description",
            "job_location",
            "package_lpa",
            "minimum_cgpa",
            "eligible_courses",
            "application_deadline",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "company_name",
            "created_at",
            "updated_at",
        ]

    def validate_eligible_courses(self, value):
        courses = [
            course.strip().upper()
            for course in value.split(",")
            if course.strip()
        ]

        if not courses:
            raise serializers.ValidationError(
                "Enter at least one eligible course."
            )

        return ",".join(dict.fromkeys(courses))

    def validate(self, attrs):
        attrs = super().validate(attrs)

        deadline = attrs.get(
            "application_deadline",
            getattr(self.instance, "application_deadline", None)
        )

        status = attrs.get(
            "status",
            getattr(self.instance, "status", PlacementDrive.Status.UPCOMING)
        )

        if (
            deadline is not None
            and deadline < timezone.localdate()
            and status != PlacementDrive.Status.CLOSED
        ):
            raise serializers.ValidationError({
                "application_deadline":
                    "A past deadline is only allowed for closed drives."
            })

        return attrs
