from django.urls import path
from .views import MyStudentProfileView
from .tpo_detail_views import TPOStudentFullDetailsView
from .tpo_views import (
    TPOStudentListCreateView,
    TPOStudentDetailView,
    TPOStudentBlockView,
    TPOStudentUnblockView,
)
from .resume_views import SecureStudentResumeView

urlpatterns=[
    path(
    "tpo/students/",
    TPOStudentListCreateView.as_view(),
    name="tpo-student-list-create",
),

path(
    "tpo/students/<int:student_id>/",
    TPOStudentDetailView.as_view(),
    name="tpo-student-detail",
),

path(
    "tpo/students/<int:student_id>/block/",
    TPOStudentBlockView.as_view(),
    name="tpo-student-block",
),

path(
    "tpo/students/<int:student_id>/unblock/",
    TPOStudentUnblockView.as_view(),
    name="tpo-student-unblock",
),
path(
    "tpo/students/<int:student_id>/full-details/",
    TPOStudentFullDetailsView.as_view(),
    name="tpo-student-full-details",
),
path(
    "resumes/<int:student_id>/",
    SecureStudentResumeView.as_view(),
    name="secure-student-resume",
),
    path('me/',MyStudentProfileView.as_view(),name='my-student-profile'),
]