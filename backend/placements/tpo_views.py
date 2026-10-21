
from typing import cast

from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError

from accounts.permissions import IsTPO

from .models import (
    JobApplication,
    RecruitmentRound,
    StudentRoundResult,
)

from .tpo_serializers import (
    TPOApplicationSerializer,
    ApplicationStatusSerializer,
)


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


class TPOApplicationStatusView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated, IsTPO]

    def patch(self, request, application_id):

        serializer = ApplicationStatusSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        validated_data = cast(
            dict[str, str],
            serializer.validated_data
        )
        new_status = validated_data["status"]

        with transaction.atomic():

            application = get_object_or_404(
                JobApplication.objects.select_for_update(),
                pk=application_id
            )

            current_status = application.status

            allowed_transitions = {
                JobApplication.Status.APPLIED: [
                    JobApplication.Status.SHORTLISTED,
                    JobApplication.Status.REJECTED,
                ],
                JobApplication.Status.SHORTLISTED: [
                    JobApplication.Status.SELECTED,
                    JobApplication.Status.REJECTED,
                ],
                JobApplication.Status.IN_PROGRESS: [
                    JobApplication.Status.SELECTED,
                    JobApplication.Status.REJECTED,
                ],
                JobApplication.Status.REJECTED: [],
                JobApplication.Status.SELECTED: [],
            }

            allowed_transitions: dict[str, list[str]] = {
            "APPLIED": ["SHORTLISTED", "REJECTED"],
            "SHORTLISTED": ["SELECTED", "REJECTED"],
            "IN_PROGRESS": ["SELECTED", "REJECTED"],
            "REJECTED": [],
            "SELECTED": [],
}

            current_status: str = application.status

            if new_status not in allowed_transitions.get(current_status, []):
                raise ValidationError({
                    "detail": (
                        f"Cannot change status from "
                        f"{current_status} to {new_status}."
                    )
                })

            rounds = RecruitmentRound.objects.filter(
                drive=application.drive
            )

            # Validate final selection
            if new_status == JobApplication.Status.SELECTED:

                if rounds.exists():

                    total_rounds = rounds.count()

                    qualified_rounds = (
                        StudentRoundResult.objects.filter(
                            application=application,
                            round__drive=application.drive,
                            result=StudentRoundResult.Result.QUALIFIED
                        ).count()
                    )

                    if qualified_rounds != total_rounds:
                        raise ValidationError({
                            "detail": (
                                "Student must qualify all "
                                "recruitment rounds before "
                                "final selection."
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
