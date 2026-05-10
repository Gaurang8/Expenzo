from django.urls import path

from .views import (
    GroupListCreateView,
    InviteMemberView,
    GroupMembersView,
    AcceptInvitationView,
    RejectInvitationView,
    GroupInvitationsView,
    UserInvitationsView,
    RemoveGroupMemberView,
    LeaveGroupView,
    TransferOwnershipView,
    UpdateMemberRoleView,
)

urlpatterns = [
    path("", GroupListCreateView.as_view()),
    path("<int:group_id>/invite/", InviteMemberView.as_view(),),
    path("<int:group_id>/members/", GroupMembersView.as_view(),),
    path("<int:group_id>/invitations/", GroupInvitationsView.as_view(),),
    path("invitations/me/", UserInvitationsView.as_view(),),
    path("invitations/<int:invitation_id>/accept/", AcceptInvitationView.as_view(),),
    path("invitations/<int:invitation_id>/reject/", RejectInvitationView.as_view(),),
    path("members/<int:member_id>/remove/",RemoveGroupMemberView.as_view(),),
    path("<int:group_id>/leave/",LeaveGroupView.as_view(),),
    path("<int:group_id>/transfer-ownership/",TransferOwnershipView.as_view(),),
    path("members/<int:member_id>/role/",UpdateMemberRoleView.as_view(),),
]