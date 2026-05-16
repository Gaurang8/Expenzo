from decimal import Decimal

from django.db import transaction

from apps.accounts.models import User

from .models import Expense, ExpensePayer, ExpenseParticipant, Settlement

from .enums import SplitType

from .validators import (
    validate_group_members,
    validate_total_paid_amount,
    validate_split_data,
    validate_settlement,
)


def calculate_equal_split(
    *,
    total_amount,
    participants,
):
    participant_count = len(participants)

    split_amount = total_amount / participant_count

    split_amount = split_amount.quantize(Decimal("0.01"))

    amounts = []

    total_assigned = Decimal("0.00")

    for index, participant in enumerate(participants):

        amount = split_amount

        # last participant absorbs rounding
        if index == participant_count - 1:
            amount = total_amount - total_assigned

        amounts.append(
            {
                "user": participant["user"],
                "owed_amount": amount,
            }
        )

        total_assigned += amount

    return amounts


def calculate_percentage_split(
    *,
    total_amount,
    participants,
):
    calculated = []

    total_assigned = Decimal("0.00")

    participant_count = len(participants)

    for index, participant in enumerate(participants):

        percentage = Decimal(participant["percentage"])

        amount = (total_amount * percentage) / Decimal("100")

        amount = amount.quantize(Decimal("0.01"))

        # last participant absorbs rounding
        if index == participant_count - 1:
            amount = total_amount - total_assigned

        calculated.append(
            {
                "user": participant["user"],
                "owed_amount": amount,
                "percentage": percentage,
            }
        )

        total_assigned += amount

    return calculated


def calculate_exact_split(
    *,
    participants,
):
    return participants


def build_participant_splits(
    *,
    split_type,
    total_amount,
    participants,
):

    if split_type == SplitType.EQUAL:

        return calculate_equal_split(
            total_amount=total_amount,
            participants=participants,
        )

    elif split_type == SplitType.EXACT:

        return calculate_exact_split(
            participants=participants,
        )

    elif split_type == SplitType.PERCENTAGE:

        return calculate_percentage_split(
            total_amount=total_amount,
            participants=participants,
        )

    raise ValueError("Invalid split type")


@transaction.atomic
def create_expense(
    *,
    group,
    created_by,
    title,
    description=None,
    total_amount,
    currency="INR",
    split_type,
    expense_date,
    payers,
    participants,
):
    payer_user_ids = [payer["user"] for payer in payers]

    participant_user_ids = [participant["user"] for participant in participants]

    all_user_ids = payer_user_ids + participant_user_ids

    validate_group_members(
        group=group,
        user_ids=all_user_ids,
    )

    validate_total_paid_amount(
        payers=payers,
        total_amount=total_amount,
    )

    validate_split_data(
        split_type=split_type,
        payers=payers,
        participants=participants,
        total_amount=total_amount,
    )

    calculated_participants = build_participant_splits(
        split_type=split_type,
        total_amount=total_amount,
        participants=participants,
    )

    expense = Expense.objects.create(
        group=group,
        created_by=created_by,
        title=title,
        description=description,
        total_amount=total_amount,
        currency=currency,
        split_type=split_type,
        expense_date=expense_date,
    )

    payer_objects = []

    for payer in payers:

        payer_objects.append(
            ExpensePayer(
                expense=expense,
                user_id=payer["user"],
                paid_amount=payer["paid_amount"],
            )
        )

    ExpensePayer.objects.bulk_create(payer_objects)

    participant_objects = []

    for participant in calculated_participants:

        participant_objects.append(
            ExpenseParticipant(
                expense=expense,
                user_id=participant["user"],
                owed_amount=participant["owed_amount"],
                percentage=participant.get("percentage"),
            )
        )

    ExpenseParticipant.objects.bulk_create(participant_objects)

    return expense


@transaction.atomic
def update_expense(
    *,
    expense,
    title,
    description=None,
    total_amount,
    currency="INR",
    split_type,
    expense_date,
    payers,
    participants,
):
    group = expense.group
    payer_user_ids = [payer["user"] for payer in payers]
    participant_user_ids = [participant["user"] for participant in participants]
    all_user_ids = payer_user_ids + participant_user_ids

    validate_group_members(
        group=group,
        user_ids=all_user_ids,
    )

    validate_total_paid_amount(
        payers=payers,
        total_amount=total_amount,
    )

    validate_split_data(
        split_type=split_type,
        payers=payers,
        participants=participants,
        total_amount=total_amount,
    )

    calculated_participants = build_participant_splits(
        split_type=split_type,
        total_amount=total_amount,
        participants=participants,
    )

    expense.title = title
    expense.description = description
    expense.total_amount = total_amount
    expense.currency = currency
    expense.split_type = split_type
    expense.expense_date = expense_date
    expense.save()

    # Clear old relations
    expense.payers.all().delete()
    expense.participants.all().delete()

    # Create new ones
    payer_objects = []
    for payer in payers:
        payer_objects.append(
            ExpensePayer(
                expense=expense,
                user_id=payer["user"],
                paid_amount=payer["paid_amount"],
            )
        )
    ExpensePayer.objects.bulk_create(payer_objects)

    participant_objects = []
    for participant in calculated_participants:
        participant_objects.append(
            ExpenseParticipant(
                expense=expense,
                user_id=participant["user"],
                owed_amount=participant["owed_amount"],
                percentage=participant.get("percentage"),
            )
        )
    ExpenseParticipant.objects.bulk_create(participant_objects)

    return expense


@transaction.atomic
def create_settlement(
    *,
    group,
    paid_by,
    paid_to,
    amount,
    settled_at,
    created_by,
    description=None,
):
    paid_to_user = User.objects.filter(id=paid_to).first()

    if not paid_to_user:
        raise ValueError("Invalid paid_to user")

    validate_settlement(
        group=group,
        paid_by=paid_by,
        paid_to=paid_to_user,
        amount=amount,
    )

    settlement = Settlement.objects.create(
        group=group,
        paid_by=paid_by,
        paid_to=paid_to_user,
        amount=amount,
        description=description,
        settled_at=settled_at,
        created_by=created_by,
    )

    return settlement


@transaction.atomic
def update_settlement(
    *,
    settlement,
    paid_by,
    paid_to,
    amount,
    settled_at,
    description=None,
):
    paid_to_user = User.objects.filter(id=paid_to).first()
    paid_by_user = User.objects.filter(id=paid_by).first()

    if not paid_to_user or not paid_by_user:
        raise ValueError("Invalid users provided")

    validate_settlement(
        group=settlement.group,
        paid_by=paid_by_user,
        paid_to=paid_to_user,
        amount=amount,
    )

    settlement.paid_by = paid_by_user
    settlement.paid_to = paid_to_user
    settlement.amount = amount
    settlement.description = description
    settlement.settled_at = settled_at
    settlement.save()

    return settlement

