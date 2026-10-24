from rest_framework.permissions import BasePermission


class IsActiveTPO(BasePermission):
    message = "Only active TPO users can manage students."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_active
            and getattr(request.user, "role", None) == "TPO"
        )