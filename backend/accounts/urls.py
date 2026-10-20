from django.urls import path
from .views import (StudentRegistrationView,LoginView,LogoutView,CSRFTokenView)

urlpatterns = [
    path(
        'register/',
        StudentRegistrationView.as_view(),
        name='student-register'
    ),
     path(
        'login/',
        LoginView.as_view(),
        name='student-login'
    ),

    path(
        'logout/',
        LogoutView.as_view(),
        name='student-logout'
    ),

    path(
    'csrf/',
    CSRFTokenView.as_view(),
    name='csrf-token'
),

]
