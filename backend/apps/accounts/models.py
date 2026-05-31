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

    objects = UserManager()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email