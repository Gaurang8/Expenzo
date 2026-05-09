from django.db import models
from django.conf import settings

from apps.common.models import BaseModel

from .enums import (
    GroupRole,
    InvitationStatus,
)


class Group(BaseModel):
    name = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_groups",
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