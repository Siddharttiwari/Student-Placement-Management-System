from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from placements.models import (
    JobApplication,
    RecruitmentRound,
    StudentRoundResult,
)

from .models import StudentProfile
from .permissions import IsActiveTPO
from .tpo_serializers import TPOStudentListSerializer


class TPOStudentFullDetailsView(APIView):
    permission_classes = [IsAuthenticated, IsActiveTPO]

    def get(self, request, student_id):
        student = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            pk=student_id,
        )

        applications = (
                JobApplication.objects.filter(student=student)
                .select_related("drive", "drive__company")
                .order_by("-applied_at")
            )

        application_data = []

        for application in applications:
            rounds = list(
                RecruitmentRound.objects.filter(
                    drive=application.drive
                ).order_by("round_number")
            )

            results_by_round = {
                result.round.pk: result
                for result in StudentRoundResult.objects.filter(
                    application=application
                ).select_related("round")
            }

            round_data = []

            for recruitment_round in rounds:
                saved_result = results_by_round.get(
                    recruitment_round.pk
                )

                round_data.append({
                    "round_id": recruitment_round.pk,
                    "round_number": recruitment_round.round_number,
                    "round_name": recruitment_round.round_name,
                    "round_type": recruitment_round.round_type,
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

            application_data.append({
                "id": application.pk,
                "company_name": application.drive.company.name,
                "job_title": application.drive.job_title,
                "job_location": application.drive.job_location,
                "package_lpa": str(
                    application.drive.package_lpa
                ),
                "status": application.status,
                "applied_at": application.applied_at,
                "rounds": round_data,
            })

        placed = any(
            application.status == JobApplication.Status.SELECTED
            for application in applications
        )

        return Response({
            "student": TPOStudentListSerializer(
                student,
                context={"request": request}
            ).data,
            "placement_status": (
                "PLACED" if placed else "UNPLACED"
            ),
            "total_applications": len(application_data),
            "total_selections": sum(
                application.status == JobApplication.Status.SELECTED
                for application in applications
            ),
            "applications": application_data,
        })
