from django.urls import path

from .views import (
    CreateExpenseView,
    ExpenseDetailView,
    CreateSettlementView,
    SettlementDetailView,
    GroupActivityFeedView,
    GroupBalancesView,
    UserActivityFeedView,
    CategoryListCreateView,
)

urlpatterns = [
    # Global Activity Feed
    path("activities/", UserActivityFeedView.as_view()),
    
    # Categories
    path("categories/", CategoryListCreateView.as_view()),
    
    # Expenses
    path("groups/<int:group_id>/create/", CreateExpenseView.as_view()),
    path("<int:expense_id>/", ExpenseDetailView.as_view()),
    # Settlements
    path("groups/<int:group_id>/settlements/create/", CreateSettlementView.as_view()),
    path("settlements/<int:settlement_id>/", SettlementDetailView.as_view()),
    path("groups/<int:group_id>/activities/", GroupActivityFeedView.as_view()),
    path("groups/<int:group_id>/balances/", GroupBalancesView.as_view()),
]
