
from django.shortcuts import get_object_or_404
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from typing import cast
from accounts.permissions import IsTPO

from .models import JobApplication
from .tpo_serializers import (
    TPOApplicationSerializer,
    ApplicationStatusSerializer,
)


# TPO can view all student applications
class TPOApplicationListView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated, IsTPO]

    def get(self, request):

        applications = JobApplication.objects.select_related(
            "student",
            "drive",
            "drive__company",
        ).all()

        serializer = TPOApplicationSerializer(
            applications,
            many=True
        )

        return Response(serializer.data)


# TPO can update application status
class TPOApplicationStatusView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated, IsTPO]

    def patch(self, request, application_id):

        serializer = ApplicationStatusSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        validated_data = cast(dict[str, str], serializer.validated_data)

        new_status = validated_data["status"]

        with transaction.atomic():

            application = get_object_or_404(
                JobApplication.objects.select_for_update(),
                pk=application_id
            )

            allowed_transitions = {
                "APPLIED": ["SHORTLISTED", "REJECTED"],
                "SHORTLISTED": ["SELECTED", "REJECTED"],
                "REJECTED": [],
                "SELECTED": [],
            }

            current_status = application.status

            if new_status not in allowed_transitions.get(
                current_status, []
            ):
                raise ValidationError({
                    "detail": (
                        f"Cannot change status from "
                        f"{current_status} to {new_status}."
                    )
                })

            application.status = new_status

            application.save(
                update_fields=["status", "updated_at"]
            )

        return Response({
            "message": "Application status updated successfully.",
            "application": TPOApplicationSerializer(
                application
            ).data
        })
