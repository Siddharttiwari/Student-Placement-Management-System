
from django.db import transaction
from django.shortcuts import get_object_or_404
from typing import Any, cast
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from accounts.permissions import IsTPO

from .models import (
    JobApplication,
    RecruitmentRound,
    StudentRoundResult,
)
from .round_result_serializers import (
    StudentRoundResultSerializer,
    RoundResultUpdateSerializer,
)


class TPORoundResultView(APIView):
    permission_classes = [IsAuthenticated, IsTPO]
    def get(self, request, application_id):
        application = get_object_or_404(
            JobApplication.objects.select_related(
                "student",
                "drive",
                "drive__company"
            ),
            pk=application_id
        )

        recruitment_rounds = RecruitmentRound.objects.filter(
            drive=application.drive
        ).order_by("round_number")

        saved_results = StudentRoundResult.objects.filter(
            application=application
        )

        results_by_round = {
            result.round.pk: result
            for result in saved_results
        }

        rounds_data = []

        for recruitment_round in recruitment_rounds:
            saved_result = results_by_round.get(
                recruitment_round.pk
            )

            rounds_data.append({
                "round_id": recruitment_round.pk,
                "round_number": recruitment_round.round_number,
                "round_name": recruitment_round.round_name,
                "round_type": recruitment_round.round_type,
                "description": recruitment_round.description,
                "scheduled_date": recruitment_round.scheduled_date,
                "result": (
                    saved_result.result
                    if saved_result
                    else "NOT_STARTED"
                ),
                "remarks": (
                    saved_result.remarks
                    if saved_result
                    else ""
                ),
            })

        return Response({
            "application_id": application.pk,
            "student_name": application.student.full_name,
            "roll_number": application.student.roll_number,
            "company_name": application.drive.company.name,
            "job_title": application.drive.job_title,
            "status": application.status,
            "rounds": rounds_data,
        })


    @transaction.atomic
    def patch(self, request, application_id):
        application = get_object_or_404(
            JobApplication.objects.select_for_update(),
            pk=application_id
        )

        serializer = RoundResultUpdateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        round_id = request.data.get("round")

        if not round_id:
            raise ValidationError({
                "round": "Round ID is required."
            })

        recruitment_round = get_object_or_404(
            RecruitmentRound,
            pk=round_id,
            drive=application.drive
        )

        if application.status not in [
            JobApplication.Status.SHORTLISTED,
            JobApplication.Status.IN_PROGRESS,
        ]:
            raise ValidationError({
                "application": (
                    "Student must be shortlisted or "
                    "in progress to participate in rounds."
                )
            })

        previous_rounds = RecruitmentRound.objects.filter(
            drive=application.drive,
            round_number__lt=recruitment_round.round_number
        )

        for previous_round in previous_rounds:
            previous_result = StudentRoundResult.objects.filter(
                application=application,
                round=previous_round,
                result=StudentRoundResult.Result.QUALIFIED
            ).exists()

            if not previous_result:
                raise ValidationError({
                    "round": (
                        f"Student must qualify Round "
                        f"{previous_round.round_number} first."
                    )
                })

        existing_result = StudentRoundResult.objects.filter(
            application=application,
            round=recruitment_round
        ).first()

        if existing_result and existing_result.result != (
            StudentRoundResult.Result.PENDING
        ):
            raise ValidationError({
                "result": "This round has already been processed."
            })

        if existing_result is None:
            existing_result = StudentRoundResult(
                application=application,
                round=recruitment_round
            )

        validated_data = cast(
            dict[str, Any],
            serializer.validated_data
        )

        existing_result.result = validated_data["result"]
        existing_result.remarks = validated_data.get("remarks", "")
        existing_result.save()
        if existing_result.result == (
            StudentRoundResult.Result.REJECTED
        ):
            application.status = JobApplication.Status.REJECTED
        else:
            application.status = JobApplication.Status.IN_PROGRESS

        application.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "message": "Round result updated successfully.",
                "application_status": application.status,
                "round_result": StudentRoundResultSerializer(
                    existing_result
                ).data,
            },
            status=status.HTTP_200_OK
        )