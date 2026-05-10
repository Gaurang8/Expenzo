from rest_framework.permissions import BasePermission

from .models import GroupMember
from .enums import GroupRole


class IsGroupMember(BasePermission):

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return GroupMember.objects.filter(
            group=obj,
            user=request.user,
        ).exists()


class IsGroupAdminOrOwner(BasePermission):

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return GroupMember.objects.filter(
            group=obj,
            user=request.user,
            role__in=[
                GroupRole.OWNER,
                GroupRole.ADMIN,
            ]
        ).exists()