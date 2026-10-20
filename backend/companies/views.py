from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsTPO
from .models import Company
from .serializers import CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):

    queryset = Company.objects.all()
    serializer_class = CompanySerializer

    authentication_classes = [
        SessionAuthentication
    ]

    permission_classes = [
        IsAuthenticated,
        IsTPO
    ]
