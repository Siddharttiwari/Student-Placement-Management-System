from .round_views import TPORecruitmentRoundListCreateView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .round_result_views import TPORoundResultView
from .student_round_views import StudentRecruitmentProgressView

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

    path(
    "tpo/drives/<int:drive_id>/rounds/",
    TPORecruitmentRoundListCreateView.as_view(),
    name="tpo-recruitment-rounds",
    ),

    path(
    "tpo/applications/<int:application_id>/round-results/",
    TPORoundResultView.as_view(),
    name="tpo-round-results",
    ),

    path(
    "student/applications/<int:application_id>/rounds/",
    StudentRecruitmentProgressView.as_view(),
    name="student-recruitment-progress",
    ),

    path("", include(router.urls)),
]
