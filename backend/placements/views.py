
from rest_framework import viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsTPO

from .models import PlacementDrive
from .serializers import PlacementDriveSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

from students.models import StudentProfile
from .eligibility import check_student_eligibility
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError

from .models import JobApplication
from .application_serializers import JobApplicationSerializer

class PlacementDriveViewSet(viewsets.ModelViewSet):

    queryset = PlacementDrive.objects.select_related(
        "company"
    ).all()

    serializer_class = PlacementDriveSerializer

    authentication_classes = [
        SessionAuthentication
    ]

    permission_classes = [
        IsAuthenticated,
        IsTPO
    ]

class StudentAvailableJobsView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if getattr(request.user, "role", None) != "STUDENT":
            raise PermissionDenied(
                "Only students can view this endpoint."
            )

        try:
            student = StudentProfile.objects.get(
                user=request.user
            )
        except StudentProfile.DoesNotExist:
            raise NotFound("Student profile not found.")

        drives = PlacementDrive.objects.select_related(
            "company"
        ).all()

        results = []

        for drive in drives:

            eligibility = check_student_eligibility(
                student,
                drive
            )

            results.append({
                "id": drive.pk,
                "company_name": drive.company.name,
                "job_title": drive.job_title,
                "job_description": drive.job_description,
                "job_location": drive.job_location,
                "package_lpa": str(drive.package_lpa),
                "minimum_cgpa": str(drive.minimum_cgpa),
                "eligible_courses": drive.eligible_courses,
                "application_deadline": drive.application_deadline,
                "status": drive.status,
                "eligible": eligibility["eligible"],
                "reasons": eligibility["reasons"],
            })

        return Response(results)



class StudentApplyJobView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, drive_id):

        # Step 1: Verify student role
        if getattr(request.user, "role", None) != "STUDENT":
            raise PermissionDenied(
                "Only students can apply for jobs."
            )

        # Step 2: Fetch student profile
        try:
            student = StudentProfile.objects.get(
                user=request.user
            )
        except StudentProfile.DoesNotExist:
            raise NotFound("Student profile not found.")

        # Step 3: Fetch placement drive
        try:
            drive = PlacementDrive.objects.select_related(
                "company"
            ).get(pk=drive_id)
        except PlacementDrive.DoesNotExist:
            raise NotFound("Placement drive not found.")

        # Step 4: Prevent duplicate applications
        if JobApplication.objects.filter(
            student=student,
            drive=drive
        ).exists():
            raise ValidationError({
                "detail": "You have already applied for this job."
            })

        # Step 5: Check eligibility on the backend
        eligibility = check_student_eligibility(
            student,
            drive
        )

        if not eligibility["eligible"]:
            raise ValidationError({
                "detail": "You are not eligible for this job.",
                "reasons": eligibility["reasons"]
            })

        # Step 6: Save the application
        try:
            with transaction.atomic():
                application = JobApplication.objects.create(
                    student=student,
                    drive=drive,
                    status=JobApplication.Status.APPLIED
                )
        except IntegrityError:
            raise ValidationError({
                "detail": "You have already applied for this job."
            })

        # Step 7: Return application details
        serializer = JobApplicationSerializer(application)

        return Response(
            {
                "message": "Application submitted successfully.",
                "application": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class StudentMyApplicationsView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Step 1: Verify student role
        if getattr(request.user, "role", None) != "STUDENT":
            raise PermissionDenied(
                "Only students can view their applications."
            )

        # Step 2: Fetch student profile
        try:
            student = StudentProfile.objects.get(
                user=request.user
            )
        except StudentProfile.DoesNotExist:
            raise NotFound("Student profile not found.")

        # Step 3: Fetch only this student's applications
        applications = JobApplication.objects.filter(
            student=student
        ).select_related(
            "drive",
            "drive__company"
        )

        # Step 4: Serialize application records
        serializer = JobApplicationSerializer(
            applications,
            many=True
        )

        return Response(serializer.data)
