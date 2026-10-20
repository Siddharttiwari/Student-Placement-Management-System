
from django.urls import path
from .tpo_views import TPODashboardView

urlpatterns = [
    path(
        "dashboard/",
        TPODashboardView.as_view(),
        name="tpo-dashboard"
    ),
]
