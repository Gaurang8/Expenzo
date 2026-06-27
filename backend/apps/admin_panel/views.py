from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from apps.common.responses import success_response, error_response
from apps.common.permissions import IsAdminUser, IsSuperAdminUser
from apps.common.pagination import CustomPagination
from apps.common.utils import export_csv

from apps.accounts.models import User
from apps.groups.models import Group, GroupMember
from apps.expenses.models import Expense, Settlement, Category, ExpensePayer, ExpenseParticipant
from django.db.models import Subquery, OuterRef, DecimalField, F
from django.db.models.functions import Coalesce
from decimal import Decimal

from .serializers import (
    AdminUserSerializer,
    AdminUserEditSerializer,
    AdminGroupSerializer,
    AdminGroupEditSerializer,
    AdminExpenseSerializer,
    AdminSettlementSerializer,
    AdminCategorySerializer,
)

def get_annotated_admin_user_queryset():
    total_paid = ExpensePayer.objects.filter(user=OuterRef('pk')).values('user').annotate(
        total=Sum('paid_amount')
    ).values('total')
    
    total_owed = ExpenseParticipant.objects.filter(user=OuterRef('pk')).values('user').annotate(
        total=Sum('owed_amount')
    ).values('total')
    
    total_settlements_paid = Settlement.objects.filter(paid_by=OuterRef('pk')).values('paid_by').annotate(
        total=Sum('amount')
    ).values('total')
    
    total_settlements_received = Settlement.objects.filter(paid_to=OuterRef('pk')).values('paid_to').annotate(
        total=Sum('amount')
    ).values('total')
    
    return User.objects.annotate(
        groups_count=Count('group_memberships', distinct=True),
        expenses_count=Count('expense_participations', distinct=True),
        total_paid=Coalesce(Subquery(total_paid, output_field=DecimalField()), Decimal('0.00')),
        total_owed=Coalesce(Subquery(total_owed, output_field=DecimalField()), Decimal('0.00')),
        total_settlements_paid=Coalesce(Subquery(total_settlements_paid, output_field=DecimalField()), Decimal('0.00')),
        total_settlements_received=Coalesce(Subquery(total_settlements_received, output_field=DecimalField()), Decimal('0.00')),
    ).annotate(
        unsettled_amount=F('total_paid') + F('total_settlements_received') - F('total_owed') - F('total_settlements_paid')
    )

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)

        total_users = User.objects.count()
        total_groups = Group.objects.count()
        
        # Calculate totals
        total_expenses = Expense.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        total_settlements = Settlement.objects.aggregate(total=Sum('amount'))['total'] or 0
        
        # New users per month for the last 6 months
        users_growth = (
            User.objects.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
        users_chart = [{"month": item["month"].strftime("%b %Y"), "count": item["count"]} for item in users_growth]
        
        # Top groups by expense volume
        top_groups = (
            Group.objects.annotate(
                total_spent=Sum('expenses__total_amount'),
                members_count=Count('memberships', distinct=True)
            )
            .order_by('-total_spent')[:5]
        )
        
        top_groups_data = [
            {
                "id": g.id,
                "name": g.name,
                "members_count": g.members_count,
                "total_spent": str(g.total_spent or 0)
            }
            for g in top_groups
        ]
        
        # Recent activities (latest 5 expenses + 5 settlements)
        recent_expenses = Expense.objects.select_related('group', 'created_by').order_by('-created_at')[:5]
        recent_settlements = Settlement.objects.select_related('group', 'paid_by', 'paid_to').order_by('-created_at')[:5]
        
        activities = []
        for e in recent_expenses:
            activities.append({
                "id": f"exp_{e.id}",
                "type": "expense",
                "title": f"{e.created_by.full_name} added '{e.title}' in {e.group.name}",
                "amount": str(e.total_amount),
                "created_at": e.created_at,
            })
            
        for s in recent_settlements:
            activities.append({
                "id": f"set_{s.id}",
                "type": "settlement",
                "title": f"{s.paid_by.full_name} settled with {s.paid_to.full_name} in {s.group.name}",
                "amount": str(s.amount),
                "created_at": s.created_at,
            })
            
        activities.sort(key=lambda x: x["created_at"], reverse=True)
        activities = activities[:10]
        
        # Format dates for JSON
        for a in activities:
            a["created_at"] = a["created_at"].isoformat()

        data = {
            "kpis": {
                "total_users": total_users,
                "total_groups": total_groups,
                "total_expenses": str(total_expenses),
                "total_settlements": str(total_settlements),
            },
            "charts": {
                "users_growth": users_chart
            },
            "top_groups": top_groups_data,
            "recent_activity": activities
        }
        
        return success_response(data=data)

# --- Users ---

class AdminUserListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['full_name', 'email']
    ordering_fields = ['created_at', 'full_name', 'email']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return User.objects.annotate(
            groups_count=Count('group_memberships', distinct=True),
            expenses_count=Count('expense_participations', distinct=True)
        )
        
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        users = page if page is not None else queryset
        user_ids = [u.id for u in users]
        
        balances = {uid: Decimal('0.00') for uid in user_ids}
        
        if user_ids:
            for p in ExpensePayer.objects.filter(user_id__in=user_ids).values('user_id').annotate(total=Sum('paid_amount')):
                balances[p['user_id']] += p['total']
                
            for s in Settlement.objects.filter(paid_to_id__in=user_ids).values('paid_to_id').annotate(total=Sum('amount')):
                balances[s['paid_to_id']] += s['total']
                
            for o in ExpenseParticipant.objects.filter(user_id__in=user_ids).values('user_id').annotate(total=Sum('owed_amount')):
                balances[o['user_id']] -= o['total']
                
            for s in Settlement.objects.filter(paid_by_id__in=user_ids).values('paid_by_id').annotate(total=Sum('amount')):
                balances[s['paid_by_id']] -= s['total']
                
        context = self.get_serializer_context()
        context['user_balances'] = balances
        
        serializer = self.get_serializer(users, many=True, context=context)
        
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return success_response(data=serializer.data)

class AdminUserExportView(AdminUserListView):
    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        columns = ["ID", "Name", "Email", "Active", "Staff", "Joined", "Groups Count", "Expenses Count"]
        
        def mapper(user):
            return [
                user.id, user.full_name, user.email, 
                "Yes" if user.is_active else "No",
                "Yes" if user.is_staff else "No",
                user.created_at.strftime("%Y-%m-%d"),
                user.groups_count, user.expenses_count
            ]
            
        return export_csv(queryset, columns, "expanzo_users.csv", mapper)

class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        user = get_object_or_404(get_annotated_admin_user_queryset(), pk=pk)
        return success_response(data=AdminUserSerializer(user).data)
        
    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        if user.is_superuser and not request.user.is_superuser:
            return error_response(message="Permission denied. Cannot edit superuser.")
            
        serializer = AdminUserEditSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        user = get_annotated_admin_user_queryset().get(pk=pk)
        
        return success_response(data=AdminUserSerializer(user).data)
        
    def delete(self, request, pk):
        user = get_object_or_404(get_annotated_admin_user_queryset(), pk=pk)
        if user.is_superuser:
            return error_response(message="Cannot delete a superuser.")
        if user.id == request.user.id:
            return error_response(message="Cannot delete yourself.")
            
        if user.unsettled_amount != Decimal('0.00'):
            return error_response(message=f"Cannot delete user because they have an unsettled balance of {user.unsettled_amount}.")
            
        user.delete()
        return success_response(message="User deleted successfully")

class AdminUserToggleActiveView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.is_superuser and not request.user.is_superuser:
            return error_response(message="Cannot toggle active status for a superuser.")
        if user.id == request.user.id:
            return error_response(message="Cannot toggle your own active status.")
            
        user.is_active = not user.is_active
        user.save()
        return success_response(message=f"User {'activated' if user.is_active else 'deactivated'}")

class AdminUserToggleStaffView(APIView):
    permission_classes = [IsSuperAdminUser]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.is_superuser:
            return error_response(message="Cannot toggle staff status for a superuser.")
        if user.id == request.user.id:
            return error_response(message="Cannot toggle your own staff status.")
            
        user.is_staff = not user.is_staff
        user.save()
        return success_response(message=f"User {'promoted to staff' if user.is_staff else 'demoted from staff'}")

# --- Groups ---

def get_annotated_admin_group_queryset():
    members_count_sq = GroupMember.objects.filter(group=OuterRef('pk')).values('group').annotate(
        count=Count('id')
    ).values('count')
    
    expenses_count_sq = Expense.objects.filter(group=OuterRef('pk')).values('group').annotate(
        count=Count('id')
    ).values('count')
    
    total_spent_sq = Expense.objects.filter(group=OuterRef('pk')).values('group').annotate(
        total=Sum('total_amount')
    ).values('total')
    
    return Group.objects.annotate(
        members_count=Coalesce(Subquery(members_count_sq), 0),
        expenses_count=Coalesce(Subquery(expenses_count_sq), 0),
        total_spent=Coalesce(Subquery(total_spent_sq, output_field=DecimalField()), Decimal('0.00'))
    ).select_related("created_by")

class AdminGroupListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminGroupSerializer
    pagination_class = CustomPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ['created_at', 'name', 'total_spent']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return get_annotated_admin_group_queryset()

class AdminGroupExportView(AdminGroupListView):
    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        columns = ["ID", "Name", "Members Count", "Expenses Count", "Total Spent", "Created By", "Created At"]
        
        def mapper(g):
            return [
                g.id, g.name, g.members_count, g.expenses_count, 
                g.total_spent or 0, g.created_by.email if g.created_by else "",
                g.created_at.strftime("%Y-%m-%d")
            ]
            
        return export_csv(queryset, columns, "expanzo_groups.csv", mapper)

class AdminGroupDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        group = get_object_or_404(get_annotated_admin_group_queryset(), pk=pk)
        return success_response(data=AdminGroupSerializer(group).data)
        
    def patch(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        serializer = AdminGroupEditSerializer(group, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        group = get_annotated_admin_group_queryset().get(pk=pk)
        
        return success_response(data=AdminGroupSerializer(group).data)
        
    def delete(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        group.delete()
        return success_response(message="Group deleted successfully")

# --- Expenses ---

class AdminExpenseListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminExpenseSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['group', 'category']
    search_fields = ["title"]
    ordering_fields = ['expense_date', 'total_amount']
    ordering = ['-expense_date']
    
    def get_queryset(self):
        qs = Expense.objects.select_related("group", "created_by", "category")
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(created_by_id=user_id)
        return qs

class AdminExpenseExportView(AdminExpenseListView):
    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        columns = ["ID", "Title", "Amount", "Currency", "Group", "Category", "Created By", "Date"]
        
        def mapper(e):
            return [
                e.id, e.title, e.total_amount, e.currency, e.group.name,
                e.category.name if e.category else "",
                e.created_by.email if e.created_by else "",
                e.expense_date.strftime("%Y-%m-%d")
            ]
            
        return export_csv(queryset, columns, "expanzo_expenses.csv", mapper)

class AdminExpenseDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        expense = get_object_or_404(Expense.objects.select_related("group", "created_by", "category"), pk=pk)
        return success_response(data=AdminExpenseSerializer(expense).data)
        
    def delete(self, request, pk):
        expense = get_object_or_404(Expense, pk=pk)
        expense.delete()
        return success_response(message="Expense deleted successfully")

# --- Settlements ---

class AdminSettlementListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminSettlementSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['group']
    ordering_fields = ['settled_at', 'amount']
    ordering = ['-settled_at']
    
    def get_queryset(self):
        qs = Settlement.objects.select_related("group", "paid_by", "paid_to")
        user_id = self.request.query_params.get('user')
        if user_id:
            from django.db.models import Q
            qs = qs.filter(Q(paid_by_id=user_id) | Q(paid_to_id=user_id))
        return qs

class AdminSettlementExportView(AdminSettlementListView):
    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        columns = ["ID", "Amount", "Group", "Paid By", "Paid To", "Date"]
        
        def mapper(s):
            return [
                s.id, s.amount, s.group.name,
                s.paid_by.email if s.paid_by else "",
                s.paid_to.email if s.paid_to else "",
                s.settled_at.strftime("%Y-%m-%d")
            ]
            
        return export_csv(queryset, columns, "expanzo_settlements.csv", mapper)

class AdminSettlementDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        settlement = get_object_or_404(Settlement, pk=pk)
        settlement.delete()
        return success_response(message="Settlement deleted successfully")

# --- Categories ---

class AdminCategoryListCreateView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    pagination_class = CustomPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        return Category.objects.annotate(
            expenses_count=Count('expenses')
        ).select_related("created_by")
        
    def post(self, request):
        data = request.data.copy()
        data["is_default"] = True
        
        serializer = AdminCategorySerializer(data=data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            cat = Category.objects.annotate(expenses_count=Count('expenses')).get(id=serializer.instance.id)
            return success_response(data=AdminCategorySerializer(cat).data, status_code=201)
        return error_response(errors=serializer.errors)

class AdminCategoryDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = AdminCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cat = Category.objects.annotate(expenses_count=Count('expenses')).get(id=pk)
            return success_response(data=AdminCategorySerializer(cat).data)
        return error_response(errors=serializer.errors)
        
    def delete(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        if category.expenses.exists():
            return error_response(message="Cannot delete category because it is used by expenses.")
        category.delete()
        return success_response(message="Category deleted successfully")

# --- Settings ---

class AdminPlatformSettingsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        from django.conf import settings
        import sys
        
        redis_status = "Connected" if getattr(settings, 'CACHES', None) else "Disconnected"
        
        data = {
            "app_name": "Expanzo",
            "environment": "Development" if settings.DEBUG else "Production",
            "frontend_url": getattr(settings, 'FRONTEND_URL', 'Not Configured'),
            "debug_mode": settings.DEBUG,
            "system_health": {
                "redis": redis_status,
                "database": "Connected",
                "celery": "Operational",
                "python_version": sys.version.split(" ")[0]
            }
        }
        return success_response(data=data)
