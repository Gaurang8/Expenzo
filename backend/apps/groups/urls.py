from django.urls import path

from .views import (
    GroupListCreateView,
    InviteMemberView,
    GroupMembersView,
    AcceptInvitationView,
    RejectInvitationView,
    GroupInvitationsView,
    UserInvitationsView
)

urlpatterns = [
    path("", GroupListCreateView.as_view()),
    path("<int:group_id>/invite/", InviteMemberView.as_view(),),
    path("<int:group_id>/members/", GroupMembersView.as_view(),),
    path("<int:group_id>/invitations/", GroupInvitationsView.as_view(),),
    path("invitations/me/", UserInvitationsView.as_view(),),
    path("invitations/<int:invitation_id>/accept/", AcceptInvitationView.as_view(),),
    path("invitations/<int:invitation_id>/reject/", RejectInvitationView.as_view(),),
]