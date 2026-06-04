from django.db import models
from django.conf import settings

from apps.common.models import BaseModel

from .enums import (
    GroupRole,
    InvitationStatus,
)


def get_default_group_settings():
    return {
        "invite_members": "admin",
        "remove_members": "admin",
        "update_group": "admin",
        "add_expense": "member",
        "manage_expenses": "admin",
    }


class Group(BaseModel):
    name = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
    )

    avatar = models.URLField(
        blank=True,
        null=True,
        max_length=500,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_groups",
    )

    settings = models.JSONField(
        default=get_default_group_settings,
        blank=True,
    )

    def __str__(self):
        return self.name


class GroupMember(BaseModel):
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )

    role = models.CharField(
        max_length=20,
        choices=GroupRole.choices,
        default=GroupRole.MEMBER,
    )

    joined_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        unique_together = (
            "group",
            "user",
        )


class GroupInvitation(BaseModel):
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_group_invites",
    )

    email = models.EmailField()

    status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.PENDING,
    )

    class Meta:
        unique_together = (
            "group",
            "email",
        )