from rest_framework.permissions import BasePermission

from .models import GroupMember


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