from decimal import Decimal

from rest_framework import serializers

from .models import (
    Expense,
    ExpensePayer,
    ExpenseParticipant,
)

from .enums import SplitType


class ExpensePayerSerializer(
    serializers.Serializer
):

    user = serializers.IntegerField()

    paid_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )


class ExpenseParticipantSerializer(
    serializers.Serializer
):

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


class CreateExpenseSerializer(
    serializers.Serializer
):

    title = serializers.CharField(
        max_length=255,
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    total_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    currency = serializers.CharField(
        default="INR",
    )

    split_type = serializers.ChoiceField(
        choices=SplitType.choices,
    )

    expense_date = serializers.DateTimeField()

    payers = ExpensePayerSerializer(
        many=True,
    )

    participants = (
        ExpenseParticipantSerializer(
            many=True,
        )
    )

class ExpenseDetailPayerSerializer(
    serializers.ModelSerializer
):

    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    user_name = serializers.CharField(
        source="user.name",
        read_only=True,
    )

    class Meta:
        model = ExpensePayer

        fields = (
            "id",
            "user",
            "user_email",
            "user_name",
            "paid_amount",
        )


class ExpenseDetailParticipantSerializer(
    serializers.ModelSerializer
):

    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    user_name = serializers.CharField(
        source="user.name",
        read_only=True,
    )

    class Meta:
        model = ExpenseParticipant

        fields = (
            "id",
            "user",
            "user_email",
            "user_name",
            "owed_amount",
            "percentage",
            "is_settled",
        )


class ExpenseDetailSerializer(
    serializers.ModelSerializer
):

    payers = (
        ExpenseDetailPayerSerializer(
            many=True,
            read_only=True,
        )
    )

    participants = (
        ExpenseDetailParticipantSerializer(
            many=True,
            read_only=True,
        )
    )

    created_by_email = (
        serializers.EmailField(
            source="created_by.email",
            read_only=True,
        )
    )

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
            "created_by_email",
            "payers",
            "participants",
            "created_at",
        )