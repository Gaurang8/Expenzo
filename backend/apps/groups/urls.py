from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    GroupViewSet,
    AcceptInvitationView,
    RejectInvitationView,
    UserInvitationsView,
    RemoveGroupMemberView,
    UpdateMemberRoleView,
)

router = DefaultRouter()
router.register(r'', GroupViewSet, basename='group')

urlpatterns = [
    path("", include(router.urls)),
    path("invitations/me/", UserInvitationsView.as_view(),),
    path("invitations/<int:invitation_id>/accept/", AcceptInvitationView.as_view(),),
    path("invitations/<int:invitation_id>/reject/", RejectInvitationView.as_view(),),
    path("members/<int:member_id>/remove/", RemoveGroupMemberView.as_view(),),
    path("members/<int:member_id>/role/", UpdateMemberRoleView.as_view(),),
]