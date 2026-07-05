from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
)

from apps.common.models import BaseModel
from .managers import UserManager


class User(
    AbstractBaseUser,
    PermissionsMixin,
    BaseModel,
):
    email = models.EmailField(
        unique=True,
    )

    full_name = models.CharField(
        max_length=255,
    )

    avatar = models.URLField(
        max_length=500,
        null=True,
        blank=True,
    )

    date_format = models.CharField(
        max_length=20,
        default="MMM dd, yyyy",
        choices=(
            ("MM/dd/yyyy", "MM/DD/YYYY"),
            ("dd/MM/yyyy", "DD/MM/YYYY"),
            ("yyyy-MM-dd", "YYYY-MM-DD"),
            ("dd MMM yyyy", "12 May 2025"),
            ("MMM dd, yyyy", "May 12, 2025"),
        )
    )

    is_active = models.BooleanField(
        default=True,
    )

    is_staff = models.BooleanField(
        default=False,
    )

    subscription_plan = models.CharField(
        max_length=20,
        default="FREE",
        choices=(
            ("FREE", "Free"),
            ("PRO", "Pro"),
        )
    )

    objects = UserManager()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class SubscriptionPayment(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    razorpay_order_id = models.CharField(max_length=255)
    razorpay_payment_id = models.CharField(max_length=255)
    razorpay_signature = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.user.email} - {self.razorpay_payment_id}"