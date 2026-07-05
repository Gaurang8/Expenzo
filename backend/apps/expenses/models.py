from decimal import Decimal

from django.conf import settings
from django.db import models
from pgvector.django import VectorField

from apps.common.models import BaseModel
from apps.groups.models import Group

from .enums import SplitType


class Category(BaseModel):
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, default="Tag")
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="custom_categories",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Expense(BaseModel):

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="expenses",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_expenses",
    )

    title = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
        null=True,
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    split_type = models.CharField(
        max_length=20,
        choices=SplitType.choices,
    )
    
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )

    expense_date = models.DateTimeField()

    embedding = VectorField(
        dimensions=768,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class ExpensePayer(BaseModel):

    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name="payers",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expense_payments",
    )

    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    class Meta:
        unique_together = (
            "expense",
            "user",
        )

    def __str__(self):
        return f"{self.user.email} paid " f"{self.paid_amount}"


class ExpenseParticipant(BaseModel):

    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name="participants",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expense_participations",
    )

    owed_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
    )

    is_settled = models.BooleanField(
        default=False,
    )

    class Meta:
        unique_together = (
            "expense",
            "user",
        )

    def __str__(self):
        return f"{self.user.email} owes " f"{self.owed_amount}"


class Settlement(BaseModel):

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="settlements",
    )

    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="settlements_paid",
    )

    paid_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="settlements_received",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_settlements",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    description = models.TextField(
        blank=True,
        null=True,
    )

    settled_at = models.DateTimeField()

    class Meta:
        ordering = ["-settled_at"]

    def __str__(self):

        return f"{self.paid_by.email} paid " f"{self.paid_to.email}"
