
from django.db import transaction

from .models import (
    Group,
    GroupMember,
    GroupInvitation,
)

from .selectors import (
    is_group_member,
    get_group_member,
    is_admin_or_owner,
    is_owner,
)

from .enums import (
    InvitationStatus,
    GroupRole,
)

from apps.accounts.models import User
from apps.notifications.services import (
    notify_member_removed,
    notify_member_left,
    notify_ownership_transfer,
    notify_role_change
)
from apps.expenses.services import calculate_group_balances
from .tasks import send_invitation_email_task



def create_group(
    *,
    user,
    name,
    description="",
    avatar=None,
):
    group = Group.objects.create(
        name=name,
        description=description,
        avatar=avatar,
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

    invitation = GroupInvitation.objects.filter(
        group=group,
        email=email,
    ).first()

    if invitation:
        if invitation.status == InvitationStatus.PENDING:
            raise ValueError(
                "Pending invitation already exists"
            )
        
        invitation.status = InvitationStatus.PENDING
        invitation.invited_by = invited_by
        invitation.save()
    else:
        invitation = GroupInvitation.objects.create(
            group=group,
            invited_by=invited_by,
            email=email,
        )

    send_invitation_email_task.delay(invitation.id)

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

@transaction.atomic
def remove_group_member(
    *,
    actor,
    member,
):
    balances = calculate_group_balances(group=member.group)
    member_balance = balances.get(member.user_id, {}).get("balance", 0)
    
    if member_balance != 0:
        raise ValueError(
            f"Cannot remove member with active balance ({member_balance}). "
            "Please settle all debts first."
        )

    actor_membership = get_group_member(

        group=member.group,
        user=actor,
    )

    if not actor_membership:
        raise ValueError(
            "You are not a group member"
        )

    if not is_admin_or_owner(
        actor_membership
    ):
        raise ValueError(
            "Permission denied"
        )

    if is_owner(member):
        raise ValueError(
            "Owner cannot be removed"
        )

    if actor == member.user:
        raise ValueError(
            "Use leave group instead"
        )

    notify_member_removed(
        actor_id=actor.id,
        member_user_id=member.user_id,
        member_email=member.user.email,
        group_id=member.group.id,
        group_name=member.group.name
    )

    member.delete()




@transaction.atomic
def leave_group(
    *,
    group,
    user,
):
    membership = get_group_member(
        group=group,
        user=user,
    )

    if not membership:
        raise ValueError(
            "You are not a member"
        )

    balances = calculate_group_balances(group=group)
    user_balance = balances.get(user.id, {}).get("balance", 0)
    
    if user_balance != 0:
        raise ValueError(
            f"Cannot leave group with an active balance ({user_balance}). "
            "Please settle up first."
        )

    if is_owner(membership):

        owner_count = GroupMember.objects.filter(
            group=group,
            role=GroupRole.OWNER,
        ).count()

        if owner_count <= 1:
            raise ValueError(
                "Transfer ownership before leaving"
            )

    owner = GroupMember.objects.filter(group=group, role=GroupRole.OWNER).first()

    if owner:
        notify_member_left(
            owner_id=owner.user_id,
            user_email=user.email,
            group_id=group.id,
            group_name=group.name
        )

    membership.delete()




@transaction.atomic
def transfer_ownership(
    *,
    group,
    current_owner,
    target_member,
):
    current_owner_membership = (
        get_group_member(
            group=group,
            user=current_owner,
        )
    )

    if not current_owner_membership:
        raise ValueError(
            "Not group member"
        )

    if not is_owner(
        current_owner_membership
    ):
        raise ValueError(
            "Only owner can transfer ownership"
        )

    target_membership = get_group_member(
        group=group,
        user=target_member,
    )

    if not target_membership:
        raise ValueError(
            "Target user not in group"
        )

    current_owner_membership.role = (
        GroupRole.ADMIN
    )

    target_membership.role = (
        GroupRole.OWNER
    )

    current_owner_membership.save()
    target_membership.save()

    notify_ownership_transfer(
        new_owner_id=target_member.id,
        old_owner_id=current_owner.id,
        group_id=group.id,
        group_name=group.name,
        new_owner_name=target_member.full_name
    )



def update_member_role(
    *,
    actor,
    member,
    role,
):
    actor_membership = get_group_member(
        group=member.group,
        user=actor,
    )

    if not actor_membership:
        raise ValueError(
            "Not group member"
        )

    if not is_owner(actor_membership):
        raise ValueError(
            "Only owner can update roles"
        )

    if is_owner(member):
        raise ValueError(
            "Cannot modify owner role"
        )

    member.role = role
    member.save()

    notify_role_change(
        user_id=member.user_id,
        actor_id=actor.id,
        group_id=member.group.id,
        group_name=member.group.name,
        user_name=member.user.full_name,
        new_role=role
    )

    return member



def build_group_permissions(membership):
    role = membership.role

    return {
        "can_invite_members": role in [GroupRole.OWNER, GroupRole.ADMIN],
        "can_remove_members": role in [GroupRole.OWNER, GroupRole.ADMIN],
        "can_update_roles": role == GroupRole.OWNER,
        "can_update_group": role in [GroupRole.OWNER, GroupRole.ADMIN],
        "can_transfer_ownership": role == GroupRole.OWNER,
        "can_delete_group": role == GroupRole.OWNER,
        "can_leave_group": role != GroupRole.OWNER,
        "can_add_expense": True,  # For now, all members can add expenses
        "can_manage_expenses": role in [GroupRole.OWNER, GroupRole.ADMIN],
    }