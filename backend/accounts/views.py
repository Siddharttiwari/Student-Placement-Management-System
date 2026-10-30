
from typing import cast

from django.contrib.auth import authenticate, login, logout

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied

from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from .models import User
from .serializers import (
    StudentRegistrationSerializer,
    LoginSerializer,
)

import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_protect, name='dispatch')
class StudentRegistrationView(generics.CreateAPIView):

    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]

@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = cast(dict[str, str], serializer.validated_data)

        username = data["username"]
        password = data["password"]

        try:
            authenticated_user = authenticate(
                request,
                username=username,
                password=password
            )

            if authenticated_user is None:
                return Response(
                    {"detail": "Invalid username or password."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = cast(User, authenticated_user)

            if user.role not in ["STUDENT", "TPO"]:
                return Response(
                    {"detail": "Your account role is not supported."},
                    status=status.HTTP_403_FORBIDDEN
                )

            login(request, user)

            return Response(
                {
                    "message": "Login successful",
                    "username": user.username,
                    "role": user.role
                },
                status=status.HTTP_200_OK
            )

        except Exception:
            logger.exception("Unexpected error during login")

            return Response(
                {"detail": "An internal server error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    


class LogoutView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):

        # Step 1: Destroy authenticated session
        logout(request)

        # Step 2: Return success response
        return Response(
            {
                'message': 'Logout successful'
            },
            status=status.HTTP_200_OK
        )


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'message': 'CSRF cookie set successfully'
        })