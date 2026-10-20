from django.urls import path
from .views import MyStudentProfileView

urlpatterns=[path('me/',MyStudentProfileView.as_view(),name='my-student-profile'),]