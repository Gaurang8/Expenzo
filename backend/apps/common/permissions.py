from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user

class IsAdminUser(BasePermission):
    """Only users with is_staff=True can access admin endpoints."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class IsSuperAdminUser(BasePermission):
    """Only superusers can perform critical admin operations."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)