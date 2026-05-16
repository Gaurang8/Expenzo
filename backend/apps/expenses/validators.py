from decimal import Decimal

from rest_framework.exceptions import ValidationError

from apps.groups.models import GroupMember

from .enums import SplitType


def validate_group_members(
    *,
    group,
    user_ids,
):
    member_ids = set(
        GroupMember.objects.filter(
            group=group,
            user_id__in=user_ids,
        ).values_list(
            "user_id",
            flat=True,
        )
    )

    invalid_users = set(user_ids) - member_ids

    if invalid_users:
        raise ValidationError("Some users are not group members")


def validate_total_paid_amount(
    *,
    payers,
    total_amount,
):
    total_paid = sum(Decimal(payer["paid_amount"]) for payer in payers)

    if total_paid != total_amount:
        raise ValidationError("Total paid amount must equal expense total")


def validate_equal_split(
    *,
    participants,
):
    if not participants:
        raise ValidationError("Participants required")


def validate_exact_split(
    *,
    participants,
    total_amount,
):
    total_owed = sum(
        Decimal(participant["owed_amount"]) for participant in participants
    )

    if total_owed != total_amount:
        raise ValidationError("Exact split total must equal expense total")


def validate_percentage_split(
    *,
    participants,
):
    total_percentage = sum(
        Decimal(participant["percentage"]) for participant in participants
    )

    if total_percentage != Decimal("100"):
        raise ValidationError("Percentage split must equal 100")


def validate_involved_users(
    *,
    payers,
    participants,
):
    involved_users = {p["user"] for p in payers} | {
        p["user"] for p in participants
    }
    if len(involved_users) < 2:
        raise ValidationError("An expense must involve at least two different members")


def validate_split_data(
    *,
    split_type,
    payers,
    participants,
    total_amount,
):
    validate_involved_users(
        payers=payers,
        participants=participants,
    )

    if split_type == SplitType.EQUAL:
        validate_equal_split(
            participants=participants,
        )

    elif split_type == SplitType.EXACT:
        validate_exact_split(
            participants=participants,
            total_amount=total_amount,
        )

    elif split_type == SplitType.PERCENTAGE:
        validate_percentage_split(
            participants=participants,
        )


def validate_settlement(
    *,
    group,
    paid_by,
    paid_to,
    amount,
):

    if paid_by.id == paid_to.id:
        raise ValidationError("Cannot settle with yourself")

    if amount <= 0:
        raise ValidationError("Amount must be positive")

    member_ids = set(
        GroupMember.objects.filter(
            group=group,
            user_id__in=[
                paid_by.id,
                paid_to.id,
            ],
        ).values_list(
            "user_id",
            flat=True,
        )
    )

    if paid_by.id not in member_ids:
        raise ValidationError("Payer not group member")

    if paid_to.id not in member_ids:
        raise ValidationError("Receiver not group member")
