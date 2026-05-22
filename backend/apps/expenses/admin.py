from django.contrib import admin
from .models import Expense, ExpensePayer, ExpenseParticipant, Settlement

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'group', 'total_amount', 'created_by', 'expense_date')
    list_filter = ('group', 'expense_date', 'split_type')
    search_fields = ('title', 'group__name', 'created_by__email')

@admin.register(ExpensePayer)
class ExpensePayerAdmin(admin.ModelAdmin):
    list_display = ('expense', 'user', 'paid_amount')
    list_filter = ('expense__group', 'user')
    search_fields = ('user__email', 'expense__title')

@admin.register(ExpenseParticipant)
class ExpenseParticipantAdmin(admin.ModelAdmin):
    list_display = ('expense', 'user', 'owed_amount', 'is_settled')
    list_filter = ('is_settled', 'expense__group', 'user')
    search_fields = ('user__email', 'expense__title')

@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ('group', 'paid_by', 'paid_to', 'amount', 'settled_at')
    list_filter = ('group', 'settled_at')
    search_fields = ('paid_by__email', 'paid_to__email', 'group__name')
