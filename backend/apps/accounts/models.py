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