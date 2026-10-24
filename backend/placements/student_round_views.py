
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import (
    JobApplication,
    RecruitmentRound,
    StudentRoundResult,
)


class StudentRecruitmentProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, application_id):
        # Only students can access this endpoint.
        if request.user.role != "STUDENT":
            raise PermissionDenied(
                "Only students can view recruitment progress."
            )

        # Restrict access to applications owned by this student.
        application = get_object_or_404(
            JobApplication.objects.select_related(
                "student",
                "drive",
                "drive__company",
            ),
            pk=application_id,
            student__user=request.user,
        )

        # All configured rounds for this placement drive.
        rounds = RecruitmentRound.objects.filter(
            drive=application.drive
        ).order_by("round_number")

        # Results belonging only to this application.
        saved_results = StudentRoundResult.objects.filter(
            application=application
        ).select_related("round")

        result_map = {
            result.round.pk: result
            for result in saved_results
        }

        round_data = []

        for recruitment_round in rounds:
            saved = result_map.get(recruitment_round.pk)

            round_data.append({
                "round_id": recruitment_round.pk,
                "round_number": recruitment_round.round_number,
                "round_name": recruitment_round.round_name,
                "round_type": recruitment_round.round_type,
                "scheduled_date": recruitment_round.scheduled_date,
                "result": (
                    saved.result if saved else "NOT_STARTED"
                ),
            })

        return Response({
            "application_id": application.pk,
            "company_name": application.drive.company.name,
            "job_title": application.drive.job_title,
            "status": application.status,
            "rounds": round_data,
        })
