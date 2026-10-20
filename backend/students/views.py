
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.parsers import (JSONParser,MultiPartParser,FormParser,)

from .models import StudentProfile
from .serializers import StudentProfileSerializer


class MyStudentProfileView(APIView):

    # Only authenticated users can access this API
    permission_classes = [IsAuthenticated]

    # Accept JSON data and uploaded files
    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    # Get the logged-in student's profile
    def get_student(self, request):

        if request.user.role != "STUDENT":
            raise PermissionDenied(
                "Only students can access this endpoint."
            )

        try:
            student = StudentProfile.objects.select_related(
                "user"
            ).get(user=request.user)

        except StudentProfile.DoesNotExist:
            raise NotFound(
                "Student profile not found."
            )

        return student

    # GET: Retrieve student profile
    def get(self, request):

        student = self.get_student(request)

        serializer = StudentProfileSerializer(
            student,
            context={"request": request}
        )

        return Response(serializer.data)

    # PATCH: Update profile or upload resume
    def patch(self, request):

        student = self.get_student(request)

        serializer = StudentProfileSerializer(
            student,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response({
            "message": "Student profile updated successfully.",
            "profile": serializer.data
        })
