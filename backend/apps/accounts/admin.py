from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = (
        "id",
        "email",
        "full_name",
        "is_staff",
        "is_active",
    )

    ordering = ("id",)

    search_fields = (
        "email",
        "full_name",
    )

    fieldsets = (
        (None, {
            "fields": (
                "email",
                "password",
            )
        }),

        ("Personal Info", {
            "fields": (
                "full_name",
            )
        }),

        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),

        ("Important Dates", {
            "fields": (
                "last_login",
                "created_at",
                "updated_at",
            )
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "full_name",
                "password1",
                "password2",
                "is_staff",
                "is_active",
            ),
        }),
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "last_login",
    )