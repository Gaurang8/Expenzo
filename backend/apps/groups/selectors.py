from .models import (
    Group,
    GroupMember,
    GroupInvitation,
)
from .enums import GroupRole


def get_user_groups(user):
    return Group.objects.filter(
        memberships__user=user
    ).distinct()


def get_group_members(group):
    return GroupMember.objects.filter(
        group=group
    ).select_related("user")


def get_group_member(
    *,
    group,
    user,
):
    return GroupMember.objects.filter(
        group=group,
        user=user,
    ).first()


def get_group_member_by_id(
    member_id,
):
    return GroupMember.objects.filter(
        id=member_id
    ).select_related(
        "user",
        "group",
    ).first()


def is_group_member(group, user):
    return GroupMember.objects.filter(
        group=group,
        user=user,
    ).exists()


def get_group_invitation_by_id(
    invitation_id,
):
    return GroupInvitation.objects.filter(
        id=invitation_id
    ).first()

def is_owner(member):
    return member.role == GroupRole.OWNER


def is_admin_or_owner(member):
    return member.role in [
        GroupRole.ADMIN,
        GroupRole.OWNER,
    ]