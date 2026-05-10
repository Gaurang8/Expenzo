
from django.db import transaction

from .models import (
    Group,
    GroupMember,
    GroupInvitation,
)

from .selectors import (
    is_group_member,
)

from .enums import (
    InvitationStatus,
    GroupRole,
)

from apps.accounts.models import User


def create_group(
    *,
    user,
    name,
    description="",
):
    group = Group.objects.create(
        name=name,
        description=description,
        created_by=user,
    )

    GroupMember.objects.create(
        group=group,
        user=user,
        role=GroupRole.OWNER,
    )

    return group

def invite_member(
    *,
    group,
    invited_by,
    email,
):
    if invited_by.email == email:
        raise ValueError(
            "You are already in the group"
        )

    existing_user = User.objects.filter(
        email=email
    ).first()

    if existing_user and is_group_member(
        group,
        existing_user,
    ):
        raise ValueError(
            "User is already a group member"
        )

    if GroupInvitation.objects.filter(
        group=group,
        email=email,
        status=InvitationStatus.PENDING,
    ).exists():
        raise ValueError(
            "Pending invitation already exists"
        )

    invitation = GroupInvitation.objects.create(
        group=group,
        invited_by=invited_by,
        email=email,
    )

    return invitation

@transaction.atomic
def accept_invitation(
    *,
    invitation,
    user,
):
    if invitation.email != user.email:
        raise ValueError(
            "Invitation email mismatch"
        )

    if is_group_member(
        invitation.group,
        user,
    ):
        raise ValueError(
            "Already group member"
        )

    GroupMember.objects.create(
        group=invitation.group,
        user=user,
        role=GroupRole.MEMBER,
    )

    invitation.status = (
        InvitationStatus.ACCEPTED
    )

    invitation.save()

    return invitation

def reject_invitation(invitation):
    invitation.status = (
        InvitationStatus.REJECTED
    )

    invitation.save()

    return invitation