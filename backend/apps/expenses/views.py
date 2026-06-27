from itertools import chain

from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.common.responses import success_response, error_response
from apps.common.pagination import CustomPagination
from django.db.models.functions import TruncMonth

from django.core.cache import cache

from apps.groups.models import Group, GroupMember
from apps.groups.selectors import has_setting_permission

from .models import Expense, Settlement, Category

from .serializers import (
    CreateExpenseSerializer,
    ExpenseDetailSerializer,
    CreateSettlementSerializer,
    SettlementDetailSerializer,
    CategorySerializer,
)
from .services import (
    create_expense,
    create_settlement,
    update_expense,
    update_settlement,
    calculate_group_balances,
    simplify_balances,
)
from apps.accounts.models import User
from decimal import Decimal

from django.db.models import Q

def is_group_member(*, group, user):
    return GroupMember.objects.filter(group=group, user=user).exists()


def invalidate_group_caches(group_id):
    cache.delete(f"group_balances_{group_id}")

    version_key = f"group_activities_version_{group_id}"
    if cache.get(version_key) is None:
        cache.set(version_key, 2, timeout=None)
    else:
        try:
            cache.incr(version_key)
        except ValueError:
            cache.set(version_key, 2, timeout=None)
            
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern("user_activities_feed_*")


class CreateExpenseView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):

        group = get_object_or_404(Group, id=group_id)

        membership = GroupMember.objects.filter(group=group, user=request.user).first()
        if not membership:
            return error_response(message="You are not a group member", status_code=403)

        if not has_setting_permission(
            membership.role, group.settings.get("add_expense", "member")
        ):
            return error_response(
                message="Permission denied to add expense", status_code=403
            )

        serializer = CreateExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expense = create_expense(
            group=group,
            created_by=request.user,
            **serializer.validated_data,
        )

        invalidate_group_caches(group_id)

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
        membership = GroupMember.objects.filter(
            group=expense.group, user=request.user
        ).first()
        if not membership:
            return error_response(message="You are not a group member", status_code=403)

        if expense.created_by != request.user and not has_setting_permission(
            membership.role, expense.group.settings.get("manage_expenses", "admin")
        ):
            return error_response(
                message="Permission denied to manage expense", status_code=403
            )
        group_id = expense.group_id
        expense.delete()
        invalidate_group_caches(group_id)
        return success_response(message="Expense deleted successfully")

    def patch(self, request, expense_id):
        expense = get_object_or_404(Expense, id=expense_id)
        membership = GroupMember.objects.filter(
            group=expense.group, user=request.user
        ).first()
        if not membership:
            return error_response(message="You are not a group member", status_code=403)

        if expense.created_by != request.user and not has_setting_permission(
            membership.role, expense.group.settings.get("manage_expenses", "admin")
        ):
            return error_response(
                message="Permission denied to manage expense", status_code=403
            )

        serializer = CreateExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expense = update_expense(
            expense=expense,
            **serializer.validated_data,
        )

        invalidate_group_caches(expense.group_id)

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

        paid_by_id = serializer.validated_data.pop("paid_by")
        paid_by_user = get_object_or_404(User, id=paid_by_id)

        settlement = create_settlement(
            group=group,
            paid_by=paid_by_user,
            created_by=request.user,
            **serializer.validated_data,
        )

        invalidate_group_caches(group_id)

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

    def delete(self, request, group_id, settlement_id):
        group = get_object_or_404(Group, id=group_id)
        if not is_group_member(group=group, user=request.user):
            return error_response(
                "You are not a member of this group", status.HTTP_403_FORBIDDEN
            )

        settlement = get_object_or_404(Settlement, id=settlement_id, group=group)

        settlement.delete()
        invalidate_group_caches(group_id)

        return success_response({"message": "Settlement deleted successfully"})

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

        invalidate_group_caches(settlement.group_id)

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
    my_net = my_paid - my_owed

    primary_payer = expense.payers.first()

    return {
        "type": "expense",
        "id": expense.id,
        "group": expense.group_id,
        "title": expense.title,
        "description": expense.description,
        "total_amount": str(expense.total_amount),
        "currency": expense.currency,
        "category": (
            {
                "id": expense.category.id,
                "name": expense.category.name,
                "icon": expense.category.icon,
            }
            if expense.category
            else {"name": "Other", "icon": "Tag", "id": None}
        ),
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

        # Get current cache version for this group
        version_key = f"group_activities_version_{group_id}"
        group_version = cache.get(version_key) or 1

        # Append version to the user-specific cache key
        page = request.query_params.get("page", 1)
        cache_key = f"group_activities_{group_id}_user_{me_id}_v{group_version}_page_{page}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return success_response(
                data=cached_data,
                message="Activity feed fetched from cache successfully",
            )

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

        paginator = CustomPagination()
        paginator.page_size = 120
        paginated_activities = paginator.paginate_queryset(activities, request, view=self)
        response_data = paginator.get_paginated_response(paginated_activities).data["data"]

        # Cache for 24 hours
        cache.set(cache_key, response_data, timeout=60 * 60 * 24)

        return success_response(
            data=response_data,
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

        cache_key = f"group_balances_{group_id}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return success_response(
                data=cached_data,
                message="Balances fetched from cache successfully",
            )

        balances = calculate_group_balances(group=group)
        simplified = simplify_balances(balances)

        # Convert raw balances dict to a sorted list
        individual_balances = sorted(
            balances.values(), key=lambda x: x["balance"], reverse=True
        )

        # Convert Decimal balance to string for JSON serialization
        for b in individual_balances:
            b["balance"] = str(b["balance"].quantize(Decimal("0.01")))

        data = {
            "individual_balances": individual_balances,
            "simplified_transactions": simplified,
        }

        # Cache for 24 hours
        cache.set(cache_key, data, timeout=60 * 60 * 24)

        return success_response(
            data=data,
            message="Balances fetched successfully",
        )


class UserActivityFeedView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        me_id = request.user.id
        month_filter = request.query_params.get("month")
        page = request.query_params.get("page", 1)

        user_groups = Group.objects.filter(memberships__user=request.user)

        cache_key = f"user_activities_feed_{me_id}_month_{month_filter}_page_{page}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return success_response(
                data=cached_data,
                message="User activity feed fetched from cache successfully",
            )

        expenses_qs = Expense.objects.filter(group__in=user_groups)
        settlements_qs = Settlement.objects.filter(group__in=user_groups)

        expense_months = expenses_qs.annotate(month=TruncMonth('expense_date')).values_list('month', flat=True).distinct()
        settlement_months = settlements_qs.annotate(month=TruncMonth('settled_at')).values_list('month', flat=True).distinct()
        
        all_months = sorted(set(list(expense_months) + list(settlement_months)), reverse=True)
        available_months = [m.strftime("%B %Y") for m in all_months if m]

        if month_filter and month_filter != "All Time":
            try:
                import datetime
                dt = datetime.datetime.strptime(month_filter, "%B %Y")
                expenses_qs = expenses_qs.filter(expense_date__year=dt.year, expense_date__month=dt.month)
                settlements_qs = settlements_qs.filter(settled_at__year=dt.year, settled_at__month=dt.month)
            except ValueError:
                pass

        expenses = (
            expenses_qs
            .select_related("created_by", "group")
            .prefetch_related("payers__user", "participants__user")
            .order_by("-created_at")
        )

        settlements = (
            settlements_qs
            .select_related("paid_by", "paid_to", "created_by", "group")
            .order_by("-created_at")
        )

        expense_activities = []
        for e in expenses:
            act = _build_expense_activity(e, me_id)
            act["group_name"] = e.group.name
            expense_activities.append(act)

        settlement_activities = []
        for s in settlements:
            act = _build_settlement_activity(s, me_id)
            act["group_name"] = s.group.name
            settlement_activities.append(act)

        activities = sorted(
            chain(expense_activities, settlement_activities),
            key=lambda x: x["created_at"],
            reverse=True,
        )

        paginator = CustomPagination()
        paginator.page_size = 20
        paginated_activities = paginator.paginate_queryset(activities, request, view=self)
        response_data = paginator.get_paginated_response(paginated_activities).data["data"]
        response_data["available_months"] = available_months

        cache.set(cache_key, response_data, timeout=60)

        return success_response(
            data=response_data,
            message="User activity feed fetched successfully",
        )


class CategoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.filter(
            Q(is_default=True) | Q(created_by=request.user)
        ).distinct()
        serializer = CategorySerializer(categories, many=True)
        return success_response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user, is_default=False)
            return success_response(
                serializer.data, status_code=status.HTTP_201_CREATED
            )
        return error_response(
            serializer.errors, status_code=status.HTTP_400_BAD_REQUEST
        )
