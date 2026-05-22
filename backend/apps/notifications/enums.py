from django.db import models

class NotificationType(models.TextChoices):
    ROLE_CHANGE = 'role_change', 'Role Change'
    MEMBER_REMOVED = 'member_removed', 'Member Removed'
    MEMBER_LEFT = 'member_left', 'Member Left'
    OWNERSHIP_TRANSFER = 'ownership_transfer', 'Ownership Transfer'
    EXPENSE_ADDED = 'expense_added', 'Expense Added'
    SETTLEMENT_CONFIRMED = 'settlement_confirmed', 'Settlement Confirmed'
