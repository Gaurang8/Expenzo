from itertools import chain

from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.common.responses import success_response, error_response

from apps.groups.models import Group, GroupMember

from .models import Expense, Settlement

from .serializers import (
    CreateExpenseSerializer,
    ExpenseDetailSerializer,
    CreateSettlementSerializer,
    SettlementDetailSerializer,
)
from .services import (
    create_expense, 
    create_settlement, 
    update_expense, 
    update_settlement,
    calculate_group_balances,
    simplify_balances
)
from apps.accounts.models import User
from decimal import Decimal


def is_group_member(*, group, user):
    return GroupMember.objects.filter(group=group, user=user).exists()


class CreateExpenseView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):

        group = get_object_or_404(Group, id=group_id)

        if not is_group_member(group=group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)

        serializer = CreateExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expense = create_expense(
            group=group,
            created_by=request.user,
            **serializer.validated_data,
        )

        return success_response(
            data=ExpenseDetailSerializer(expense).data,
            message="Expense created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ExpenseDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, expense_id):

        expense = get_object_or_404(
            Expense.objects.select_related(
                "created_by",
                "group",
            ).prefetch_related(
                "payers__user",
                "participants__user",
            ),
            id=expense_id,
        )

        if not is_group_member(group=expense.group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)

        return success_response(
            data=ExpenseDetailSerializer(expense).data,
            message="Expense fetched successfully",
        )

    def delete(self, request, expense_id):
        expense = get_object_or_404(Expense, id=expense_id)
        if not is_group_member(group=expense.group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)
        
        expense.delete()
        return success_response(message="Expense deleted successfully")

    def patch(self, request, expense_id):
        expense = get_object_or_404(Expense, id=expense_id)
        if not is_group_member(group=expense.group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)

        serializer = CreateExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expense = update_expense(
            expense=expense,
            **serializer.validated_data,
        )

        return success_response(
            data=ExpenseDetailSerializer(expense).data,
            message="Expense updated successfully",
        )


class CreateSettlementView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):

        group = get_object_or_404(Group, id=group_id)

        if not is_group_member(group=group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)

        serializer = CreateSettlementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        paid_by_id = serializer.validated_data.pop('paid_by')
        paid_by_user = get_object_or_404(User, id=paid_by_id)

        settlement = create_settlement(
            group=group,
            paid_by=paid_by_user,
            created_by=request.user,
            **serializer.validated_data,
        )

        return success_response(
            data=SettlementDetailSerializer(settlement).data,
            message="Settlement created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class SettlementDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, settlement_id):

        settlement = get_object_or_404(
            Settlement.objects.select_related(
                "paid_by", "paid_to", "created_by", "group"
            ),
            id=settlement_id,
        )

        if not is_group_member(group=settlement.group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)

        return success_response(
            data=SettlementDetailSerializer(settlement).data,
            message="Settlement fetched successfully",
        )

    def delete(self, request, settlement_id):
        settlement = get_object_or_404(Settlement, id=settlement_id)
        if not is_group_member(group=settlement.group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)
        
        settlement.delete()
        return success_response(message="Settlement deleted successfully")

    def patch(self, request, settlement_id):
        settlement = get_object_or_404(Settlement, id=settlement_id)
        if not is_group_member(group=settlement.group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)

        serializer = CreateSettlementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        settlement = update_settlement(
            settlement=settlement,
            **serializer.validated_data,
        )

        return success_response(
            data=SettlementDetailSerializer(settlement).data,
            message="Settlement updated successfully",
        )


def _build_expense_activity(expense, me_id):
    """Convert an Expense into an activity dict with per-user perspective fields."""

    """Convert an Expense into an activity dict with per-user perspective fields."""

    my_payer = next((p for p in expense.payers.all() if p.user_id == me_id), None)
    my_participant = next(
        (p for p in expense.participants.all() if p.user_id == me_id), None
    )

    my_paid = Decimal(my_payer.paid_amount) if my_payer else Decimal("0")
    my_owed = Decimal(my_participant.owed_amount) if my_participant else Decimal("0")
    my_net = my_paid - my_owed  # positive = group owes me, negative = I owe group

    primary_payer = expense.payers.first()

    return {
        "type": "expense",
        "id": expense.id,
        "group": expense.group_id,
        "title": expense.title,
        "description": expense.description,
        "total_amount": str(expense.total_amount),
        "currency": expense.currency,
        "split_type": expense.split_type,
        "expense_date": expense.expense_date.isoformat(),
        "created_at": expense.created_at.isoformat(),
        "created_by": expense.created_by_id,
        "created_by_info": {
            "id": expense.created_by.id,
            "name": expense.created_by.full_name,
            "email": expense.created_by.email,
        },
        "primary_payer_info": (
            {
                "id": primary_payer.user.id,
                "name": primary_payer.user.full_name,
                "email": primary_payer.user.email,
            }
            if primary_payer
            else None
        ),
        # Per-user perspective
        "my_paid": str(my_paid),
        "my_owed": str(my_owed),
        "my_net": str(my_net),  # positive = owed to you, negative = you owe
        "is_involved": my_payer is not None or my_participant is not None,
        "payers_count": expense.payers.count(),
    }


def _build_settlement_activity(settlement, me_id):
    """Convert a Settlement into an activity dict with per-user perspective fields."""

    if settlement.paid_by_id == me_id:
        my_role = "payer"
    elif settlement.paid_to_id == me_id:
        my_role = "receiver"
    else:
        my_role = "none"

    return {
        "type": "settlement",
        "id": settlement.id,
        "group": settlement.group_id,
        "amount": str(settlement.amount),
        "description": settlement.description,
        "settled_at": settlement.settled_at.isoformat(),
        "created_at": settlement.created_at.isoformat(),
        "paid_by": settlement.paid_by_id,
        "paid_by_info": {
            "id": settlement.paid_by.id,
            "name": settlement.paid_by.full_name,
            "email": settlement.paid_by.email,
        },
        "paid_to": settlement.paid_to_id,
        "paid_to_info": {
            "id": settlement.paid_to.id,
            "name": settlement.paid_to.full_name,
            "email": settlement.paid_to.email,
        },
        "created_by": settlement.created_by_id,
        # Per-user perspective
        "my_role": my_role,  # "payer" | "receiver" | "none"
    }


class GroupActivityFeedView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):

        group = get_object_or_404(Group, id=group_id)

        if not is_group_member(group=group, user=request.user):
            return error_response(message="You are not a group member", status_code=403)

        me_id = request.user.id

        expenses = (
            Expense.objects.filter(group=group)
            .select_related("created_by")
            .prefetch_related("payers__user", "participants__user")
        )

        settlements = Settlement.objects.filter(group=group).select_related(
            "paid_by", "paid_to", "created_by"
        )

        expense_activities = [_build_expense_activity(e, me_id) for e in expenses]
        settlement_activities = [
            _build_settlement_activity(s, me_id) for s in settlements
        ]

        # Merge and sort newest-first by created_at
        activities = sorted(
            chain(expense_activities, settlement_activities),
            key=lambda x: x["created_at"],
            reverse=True,
        )

        return success_response(
            data=activities,
            message="Activity feed fetched successfully",
        )


class GroupBalancesView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):

        group = get_object_or_404(Group, id=group_id)

        if not is_group_member(group=group, user=request.user):
            return error_response(
                message="You are not a group member",
                status_code=403,
            )

        balances = calculate_group_balances(group=group)
        simplified = simplify_balances(balances)

        # Convert raw balances dict to a sorted list
        individual_balances = sorted(
            balances.values(),
            key=lambda x: x["balance"],
            reverse=True
        )

        # Convert Decimal balance to string for JSON serialization
        for b in individual_balances:
            b["balance"] = str(b["balance"].quantize(Decimal("0.01")))

        return success_response(
            data={
                "individual_balances": individual_balances,
                "simplified_transactions": simplified,
            },
            message="Balances fetched successfully",
        )
