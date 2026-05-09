from .models import (
    Group,
    GroupMember,
)

from .enums import GroupRole


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