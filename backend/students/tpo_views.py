
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import StudentProfile
from .tpo_serializers import (
    TPOStudentListSerializer,
    TPOStudentCreateSerializer,
    TPOStudentUpdateSerializer,
)
from .permissions import IsActiveTPO


class TPOOnlyMixin:
    permission_classes = [IsAuthenticated, IsActiveTPO]


class TPOStudentListCreateView(
    TPOOnlyMixin,
    generics.ListCreateAPIView
):
    queryset = StudentProfile.objects.select_related(
        "user"
    ).order_by("roll_number")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TPOStudentCreateSerializer

        return TPOStudentListSerializer


class TPOStudentDetailView(
    TPOOnlyMixin,
    generics.RetrieveUpdateAPIView
):
    queryset = StudentProfile.objects.select_related("user")
    lookup_url_kwarg = "student_id"
    http_method_names = ["get", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TPOStudentUpdateSerializer

        return TPOStudentListSerializer


class TPOStudentBlockView(TPOOnlyMixin, APIView):

    @transaction.atomic
    def patch(self, request, student_id):
        student = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            pk=student_id
        )

        user = student.user

        # Lock the user row during the status update.
        user = type(user).objects.select_for_update().get(
            pk=user.pk
        )

        user.is_active = False
        user.save(update_fields=["is_active"])

        return Response({
            "message": "Student blocked successfully.",
            "student_id": student.pk,
            "is_active": user.is_active,
        })


class TPOStudentUnblockView(TPOOnlyMixin, APIView):

    @transaction.atomic
    def patch(self, request, student_id):
        student = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            pk=student_id
        )

        user = student.user

        user = type(user).objects.select_for_update().get(
            pk=user.pk
        )

        user.is_active = True
        user.save(update_fields=["is_active"])

        return Response({
            "message": "Student unblocked successfully.",
            "student_id": student.pk,
            "is_active": user.is_active,
        })
