
from rest_framework.permissions import BasePermission


class IsTPO(BasePermission):
    """
    Allow access only to authenticated TPO users.
    """

    message = "Only Training and Placement Officers can access this resource."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "TPO"
        )
