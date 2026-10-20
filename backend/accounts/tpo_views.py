
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication

from students.models import StudentProfile
from .permissions import IsTPO
from companies.models import Company

from placements.models import PlacementDrive

class TPODashboardView(APIView):

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated, IsTPO]

    def get(self, request):

        total_students = StudentProfile.objects.count()

        return Response({
            "total_students": total_students,
            "total_companies": Company.objects.count(),
            "total_drives": PlacementDrive.objects.count(),
            "total_applications": 0,
        })
