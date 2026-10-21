
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError

from accounts.permissions import IsTPO

from .models import (
    PlacementDrive,
    RecruitmentRound,
    StudentRoundResult,
    JobApplication,
)

from .round_serializers import RecruitmentRoundSerializer


class TPORecruitmentRoundListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = RecruitmentRoundSerializer

    authentication_classes = [SessionAuthentication]

    permission_classes = [
        IsAuthenticated,
        IsTPO,
    ]

    def get_drive(self):
        return get_object_or_404(
            PlacementDrive,
            pk=self.kwargs["drive_id"]
        )

    def get_queryset(self):
        return RecruitmentRound.objects.filter(
            drive=self.get_drive()
        ).order_by("round_number")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["drive"] = self.get_drive()
        return context

    @transaction.atomic
    def perform_create(self, serializer):
        drive = PlacementDrive.objects.select_for_update().get(
            pk=self.get_drive().pk
        )

        # Prevent changing the round structure after
        # any recruitment result has been recorded.
        has_results = StudentRoundResult.objects.filter(
            application__drive=drive
        ).exists()

        if has_results:
            raise ValidationError({
                "detail": (
                    "Cannot add recruitment rounds because "
                    "student recruitment results already exist "
                    "for this placement drive."
                )
            })

        # Also block changes if applications have
        # already entered or completed recruitment.
        recruitment_started = JobApplication.objects.filter(
            drive=drive,
            status__in=[
                JobApplication.Status.IN_PROGRESS,
                JobApplication.Status.SELECTED,
            ]
        ).exists()

        if recruitment_started:
            raise ValidationError({
                "detail": (
                    "Cannot add recruitment rounds after "
                    "the recruitment process has started."
                )
            })

        serializer.save(drive=drive)
