from rest_framework import serializers
from apps.accounts.models import User
from apps.groups.models import Group
from apps.expenses.models import Expense, Settlement, Category

class AdminUserSerializer(serializers.ModelSerializer):
    groups_count = serializers.IntegerField(read_only=True)
    expenses_count = serializers.IntegerField(read_only=True)
    unsettled_amount = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "full_name", "avatar", "is_active", 
            "is_staff", "is_superuser", "created_at",
            "groups_count", "expenses_count", "unsettled_amount"
        )

    def get_unsettled_amount(self, obj):
        balances = self.context.get('user_balances')
        if balances is not None and obj.id in balances:
            return str(balances[obj.id])
        if hasattr(obj, 'unsettled_amount'):
            return str(obj.unsettled_amount)
        return "0.00"

class AdminUserEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("full_name", "email", "is_active", "is_staff")

class AdminGroupSerializer(serializers.ModelSerializer):
    members_count = serializers.IntegerField(read_only=True)
    expenses_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    created_by_info = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = (
            "id", "name", "description", "avatar", "created_at",
            "members_count", "expenses_count", "total_spent", 
            "created_by", "created_by_info"
        )
        
    def get_created_by_info(self, obj):
        if obj.created_by:
            return {"id": obj.created_by.id, "name": obj.created_by.full_name, "email": obj.created_by.email}
        return None

class AdminGroupEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ("name", "description")

class AdminExpenseSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)
    created_by_info = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id", "title", "total_amount", "currency", "split_type", 
            "expense_date", "created_at", "group", "group_name", 
            "category", "category_name", "created_by_info"
        )
        
    def get_created_by_info(self, obj):
        if obj.created_by:
            return {"id": obj.created_by.id, "name": obj.created_by.full_name, "email": obj.created_by.email}
        return None

class AdminSettlementSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)
    paid_by_info = serializers.SerializerMethodField()
    paid_to_info = serializers.SerializerMethodField()

    class Meta:
        model = Settlement
        fields = (
            "id", "amount", "settled_at", "created_at", 
            "group", "group_name", "paid_by_info", "paid_to_info"
        )
        
    def get_paid_by_info(self, obj):
        if obj.paid_by:
            return {"id": obj.paid_by.id, "name": obj.paid_by.full_name, "email": obj.paid_by.email}
        return None
        
    def get_paid_to_info(self, obj):
        if obj.paid_to:
            return {"id": obj.paid_to.id, "name": obj.paid_to.full_name, "email": obj.paid_to.email}
        return None

class AdminCategorySerializer(serializers.ModelSerializer):
    expenses_count = serializers.IntegerField(read_only=True)
    created_by_info = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id", "name", "icon", "is_default", "created_at",
            "expenses_count", "created_by_info"
        )
        
    def get_created_by_info(self, obj):
        if obj.created_by:
            return {"id": obj.created_by.id, "name": obj.created_by.full_name, "email": obj.created_by.email}
        return None
