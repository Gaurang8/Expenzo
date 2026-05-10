from .models import (
    Group,
    GroupMember,
    GroupInvitation,
)


def get_user_groups(user):
    return Group.objects.filter(
        memberships__user=user
    ).distinct()


def get_group_members(group):
    return GroupMember.objects.filter(
        group=group
    ).select_related("user")


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