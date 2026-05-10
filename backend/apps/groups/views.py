from rest_framework.views import APIView
from rest_framework import status

from apps.common.responses import (
    success_response,
)

from .models import Group
from .serializers import GroupSerializer
from .services import create_group
from django.shortcuts import get_object_or_404

from rest_framework.permissions import (
    IsAuthenticated,
)

from apps.common.responses import (
    success_response,
    error_response,
)

from .models import (
    Group,
    GroupInvitation,
    GroupMember,
)

from .serializers import (
    GroupSerializer,
    GroupMemberSerializer,
    GroupInvitationSerializer,
    InviteMemberSerializer,
)

from .selectors import (
    get_group_members,
)

from .services import (
    invite_member,
    accept_invitation,
    reject_invitation,
)


class GroupListCreateView(APIView):

    def get(self, request):
        groups = Group.objects.filter(
            memberships__user=request.user
        ).distinct()

        serializer = GroupSerializer(
            groups,
            many=True,
        )

        return success_response(
            data=serializer.data,
            message="Groups fetched successfully",
        )

    def post(self, request):
        serializer = GroupSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        group = create_group(
            user=request.user,
            **serializer.validated_data,
        )

        return success_response(
            data=GroupSerializer(group).data,
            message="Group created successfully",
            status_code=status.HTTP_201_CREATED,
        )

class InviteMemberView(APIView):

    def post(
        self,
        request,
        group_id,
    ):
        group = get_object_or_404(
            Group,
            id=group_id,
        )

        if not GroupMember.objects.filter(
            group=group,
            user=request.user,
            role__in=["owner", "admin"],
        ).exists():

            return error_response(
                message="Permission denied",
            )

        serializer = InviteMemberSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            invitation = invite_member(
                group=group,
                invited_by=request.user,
                email=serializer.validated_data["email"],
            )

            return success_response(
                data=GroupInvitationSerializer(
                    invitation
                ).data,
                message="Invitation sent",
            )

        except ValueError as e:
            return error_response(
                message=str(e),
            )

class AcceptInvitationView(APIView):

    def post(
        self,
        request,
        invitation_id,
    ):
        invitation = get_object_or_404(
            GroupInvitation,
            id=invitation_id,
        )

        try:
            accept_invitation(
                invitation=invitation,
                user=request.user,
            )

            return success_response(
                message="Invitation accepted",
            )

        except ValueError as e:
            return error_response(
                message=str(e),
            )

class RejectInvitationView(APIView):

    def post(
        self,
        request,
        invitation_id,
    ):
        invitation = get_object_or_404(
            GroupInvitation,
            id=invitation_id,
        )

        reject_invitation(invitation)

        return success_response(
            message="Invitation rejected",
        )

class GroupMembersView(APIView):

    def get(
        self,
        request,
        group_id,
    ):
        group = get_object_or_404(
            Group,
            id=group_id,
        )

        members = get_group_members(group)

        serializer = GroupMemberSerializer(
            members,
            many=True,
        )

        return success_response(
            data=serializer.data,
            message="Members fetched",
        )

class GroupInvitationsView(APIView):

    def get(
        self,
        request,
        group_id,
    ):
        group = get_object_or_404(
            Group,
            id=group_id,
        )

        invitations = group.invitations.filter(
            status="pending"
        )

        serializer = GroupInvitationSerializer(
            invitations,
            many=True,
        )

        return success_response(
            data=serializer.data,
            message="Invitations fetched",
        )

class UserInvitationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = GroupInvitation.objects.filter(
            email=request.user.email,
            status="pending"
        ).order_by("-created_at")

        serializer = GroupInvitationSerializer(
            invitations,
            many=True,
        )

        return success_response(
            data=serializer.data,
            message="User invitations fetched successfully",
        )