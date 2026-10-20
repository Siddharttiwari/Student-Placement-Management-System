
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PlacementDriveViewSet,
    StudentAvailableJobsView,
    StudentApplyJobView,
    StudentMyApplicationsView,
)

from .tpo_views import (
    TPOApplicationListView,
    TPOApplicationStatusView,
)

router = DefaultRouter()

router.register(
    "drives",
    PlacementDriveViewSet,
    basename="placement-drive"
)

urlpatterns = [

    # =====================================
    # STUDENT ROUTES
    # =====================================

    path(
        "student/jobs/",
        StudentAvailableJobsView.as_view(),
        name="student-available-jobs"
    ),

    path(
        "student/jobs/<int:drive_id>/apply/",
        StudentApplyJobView.as_view(),
        name="student-apply-job"
    ),

    path(
        "student/applications/",
        StudentMyApplicationsView.as_view(),
        name="student-my-applications"
    ),

    # =====================================
    # TPO APPLICATION ROUTES
    # =====================================

    path(
        "tpo/applications/",
        TPOApplicationListView.as_view(),
        name="tpo-applications"
    ),

    path(
        "tpo/applications/<int:application_id>/status/",
        TPOApplicationStatusView.as_view(),
        name="tpo-application-status"
    ),

    # =====================================
    # PLACEMENT DRIVE ROUTES
    # =====================================

    path("", include(router.urls)),
]
