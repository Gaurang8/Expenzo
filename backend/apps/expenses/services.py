from decimal import Decimal
from django.db import transaction, models
from django.db.models import Sum
from apps.accounts.models import User
from apps.groups.models import GroupMember
from apps.notifications.services import notify_expense_added, notify_settlement


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
    category_id=None,
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
        category_id=category_id,
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

    notify_expense_added(
        group_id=group.id,
        group_name=group.name,
        created_by_id=created_by.id,
        created_by_name=created_by.full_name,
        title=title,
        participants=[p["user"] for p in calculated_participants],
        amount_str=f"{currency} {total_amount}",
    )

    return expense


@transaction.atomic
def update_expense(
    *,
    expense,
    title,
    description=None,
    total_amount,
    currency="INR",
    category_id=None,
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
    expense.category_id = category_id
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

    notify_settlement(
        receiver_id=paid_to_user.id,
        payer_name=paid_by.full_name,
        amount=f"INR {amount}",  # Defaulting to INR as per current model logic
        group_name=group.name,
        group_id=group.id,
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


def calculate_group_balances(*, group):
    members = GroupMember.objects.filter(group=group).select_related("user")
    balances = {}

    for member in members:
        balances[member.user_id] = {
            "user_id": member.user_id,
            "email": member.user.email,
            "name": member.user.full_name,
            "avatar": member.user.avatar,
            "balance": Decimal("0.00"),
        }

    payer_totals = (
        ExpensePayer.objects.filter(expense__group=group)
        .values("user")
        .annotate(total_paid=Sum("paid_amount"))
    )

    for payer in payer_totals:
        if payer["user"] in balances:
            balances[payer["user"]]["balance"] += payer["total_paid"]

    participant_totals = (
        ExpenseParticipant.objects.filter(expense__group=group)
        .values("user")
        .annotate(total_owed=Sum("owed_amount"))
    )

    for participant in participant_totals:
        if participant["user"] in balances:
            balances[participant["user"]]["balance"] -= participant["total_owed"]

    settlements = Settlement.objects.filter(group=group)

    for settlement in settlements:
        if settlement.paid_by_id in balances:
            balances[settlement.paid_by_id]["balance"] += settlement.amount
        if settlement.paid_to_id in balances:
            balances[settlement.paid_to_id]["balance"] -= settlement.amount

    return balances


def simplify_balances(balances):
    creditors = []
    debtors = []

    for balance_data in balances.values():
        amount = balance_data["balance"]
        if amount > 0:
            creditors.append({**balance_data, "balance": amount})
        elif amount < 0:
            debtors.append({**balance_data, "balance": abs(amount)})

    creditors.sort(key=lambda x: x["balance"], reverse=True)
    debtors.sort(key=lambda x: x["balance"], reverse=True)

    simplified = []
    creditor_index = 0
    debtor_index = 0

    while creditor_index < len(creditors) and debtor_index < len(debtors):
        creditor = creditors[creditor_index]
        debtor = debtors[debtor_index]

        transfer_amount = min(creditor["balance"], debtor["balance"])

        simplified.append(
            {
                "from_user": debtor["user_id"],
                "from_user_info": {
                    "id": debtor["user_id"],
                    "email": debtor["email"],
                    "name": debtor["name"],
                    "avatar": debtor["avatar"],
                },
                "to_user": creditor["user_id"],
                "to_user_info": {
                    "id": creditor["user_id"],
                    "email": creditor["email"],
                    "name": creditor["name"],
                    "avatar": creditor["avatar"],
                },
                "amount": str(transfer_amount.quantize(Decimal("0.01"))),
            }
        )

        creditor["balance"] -= transfer_amount
        debtor["balance"] -= transfer_amount

        if creditor["balance"] == 0:
            creditor_index += 1
        if debtor["balance"] == 0:
            debtor_index += 1

    return simplified
