
from pathlib import Path

from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import StudentProfile


class SecureStudentResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user

        if not user.is_active:
            raise PermissionDenied(
                "Inactive accounts cannot access resumes."
            )

        student = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            pk=student_id
        )

        is_tpo = user.role == "TPO"
        is_owner = student.user.pk == user.pk

        if not (is_tpo or is_owner):
            raise PermissionDenied(
                "You do not have permission to view this resume."
            )

        if not student.resume:
            raise Http404("Resume not uploaded.")

        try:
            file_handle = student.resume.open("rb")
        except (FileNotFoundError, OSError, ValueError):
            raise Http404("Resume file not found.")

        filename = Path(student.resume.name).name

        response = FileResponse(
            file_handle,
            as_attachment=True,
            filename=filename,
        )

        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"

        return response
