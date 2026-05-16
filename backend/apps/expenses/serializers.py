from decimal import Decimal

from rest_framework import serializers

from .models import Expense, ExpensePayer, ExpenseParticipant, Settlement

from .enums import SplitType


from apps.common.serializers import UserInfoSerializer


class ExpensePayerSerializer(serializers.Serializer):

    user = serializers.IntegerField()

    paid_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )


class ExpenseParticipantSerializer(serializers.Serializer):

    user = serializers.IntegerField()

    owed_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
    )

    percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
    )


class CreateExpenseSerializer(serializers.Serializer):

    title = serializers.CharField(max_length=255)

    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    total_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    currency = serializers.CharField(default="INR")

    split_type = serializers.ChoiceField(choices=SplitType.choices)

    expense_date = serializers.DateTimeField()

    payers = ExpensePayerSerializer(many=True)

    participants = ExpenseParticipantSerializer(many=True)


class CreateSettlementSerializer(serializers.Serializer):

    paid_by = serializers.IntegerField()
    paid_to = serializers.IntegerField()

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    settled_at = serializers.DateTimeField()


# ─── Detail serializers (read) ─────────────────────────────────────────────────


class ExpenseDetailPayerSerializer(serializers.ModelSerializer):

    user_info = UserInfoSerializer(source="user", read_only=True)

    class Meta:
        model = ExpensePayer
        fields = (
            "id",
            "user",
            "user_info",
            "paid_amount",
        )


class ExpenseDetailParticipantSerializer(serializers.ModelSerializer):

    user_info = UserInfoSerializer(source="user", read_only=True)

    class Meta:
        model = ExpenseParticipant
        fields = (
            "id",
            "user",
            "user_info",
            "owed_amount",
            "percentage",
            "is_settled",
        )


class ExpenseDetailSerializer(serializers.ModelSerializer):

    payers = ExpenseDetailPayerSerializer(many=True, read_only=True)

    participants = ExpenseDetailParticipantSerializer(many=True, read_only=True)

    created_by_info = UserInfoSerializer(source="created_by", read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "group",
            "title",
            "description",
            "total_amount",
            "currency",
            "split_type",
            "expense_date",
            "created_by",
            "created_by_info",
            "payers",
            "participants",
            "created_at",
        )


class SettlementDetailSerializer(serializers.ModelSerializer):

    paid_by_info = UserInfoSerializer(source="paid_by", read_only=True)

    paid_to_info = UserInfoSerializer(source="paid_to", read_only=True)

    created_by_info = UserInfoSerializer(source="created_by", read_only=True)

    class Meta:
        model = Settlement
        fields = (
            "id",
            "group",
            "paid_by",
            "paid_by_info",
            "paid_to",
            "paid_to_info",
            "created_by",
            "created_by_info",
            "amount",
            "description",
            "settled_at",
            "created_at",
        )
