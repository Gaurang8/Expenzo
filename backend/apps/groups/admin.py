from django.contrib import admin
from .models import Group, GroupMember, GroupInvitation

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name', 'created_by__email')
    list_filter = ('created_at',)

@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ('group', 'user', 'role', 'joined_at')
    list_filter = ('role', 'joined_at', 'group')
    search_fields = ('user__email', 'group__name')

@admin.register(GroupInvitation)
class GroupInvitationAdmin(admin.ModelAdmin):
    list_display = ('group', 'invited_by', 'email', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'group')
    search_fields = ('email', 'group__name', 'invited_by__email')
