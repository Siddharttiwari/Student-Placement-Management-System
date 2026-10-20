
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

@method_decorator(csrf_protect, name='dispatch')
class StudentRegistrationView(generics.CreateAPIView):

    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]

@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):

        # Step 1: Validate submitted username and password
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Help Pylance understand validated_data
        data = cast(dict[str, str], serializer.validated_data)

        username = data['username']
        password = data['password']

        # Step 2: Authenticate user credentials
        authenticated_user = authenticate(
            request,
            username=username,
            password=password
        )

        if authenticated_user is None:
            return Response(
                {
                    'detail': 'Invalid username or password.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Help Pylance recognize our custom User model
        user = cast(User, authenticated_user)

        # Step 3: Check student and tpo role
        if user.role not in ["STUDENT", "TPO"]:
            return Response(
                {"detail": "Your account role is not supported."},
                status=403
            )

        # Step 4: Create authenticated session
        login(request, user)

        # Step 5: Return success response
        return Response(
            {
                'message': 'Login successful',
                'username': user.username,
                'role': user.role
            },
            status=status.HTTP_200_OK
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