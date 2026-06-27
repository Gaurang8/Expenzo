from django.urls import path

from .views import (
    AdminDashboardView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserToggleActiveView,
    AdminUserToggleStaffView,
    AdminUserExportView,
    AdminGroupListView,
    AdminGroupDetailView,
    AdminGroupExportView,
    AdminExpenseListView,
    AdminExpenseDetailView,
    AdminExpenseExportView,
    AdminSettlementListView,
    AdminSettlementDetailView,
    AdminSettlementExportView,
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    AdminPlatformSettingsView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view()),
    
    path('users/', AdminUserListView.as_view()),
    path('users/export/', AdminUserExportView.as_view()),
    path('users/<int:pk>/', AdminUserDetailView.as_view()),
    path('users/<int:pk>/toggle-active/', AdminUserToggleActiveView.as_view()),
    path('users/<int:pk>/toggle-staff/', AdminUserToggleStaffView.as_view()),
    
    path('groups/', AdminGroupListView.as_view()),
    path('groups/export/', AdminGroupExportView.as_view()),
    path('groups/<int:pk>/', AdminGroupDetailView.as_view()),
    
    path('expenses/', AdminExpenseListView.as_view()),
    path('expenses/export/', AdminExpenseExportView.as_view()),
    path('expenses/<int:pk>/', AdminExpenseDetailView.as_view()),
    
    path('settlements/', AdminSettlementListView.as_view()),
    path('settlements/export/', AdminSettlementExportView.as_view()),
    path('settlements/<int:pk>/', AdminSettlementDetailView.as_view()),
    
    path('categories/', AdminCategoryListCreateView.as_view()),
    path('categories/<int:pk>/', AdminCategoryDetailView.as_view()),
    
    path('settings/', AdminPlatformSettingsView.as_view()),
]
