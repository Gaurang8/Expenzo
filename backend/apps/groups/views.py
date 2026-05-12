from rest_framework.views import APIView
from rest_framework import status
from apps.accounts.models import User

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
    UpdateMemberRoleSerializer,
    TransferOwnershipSerializer,
)

from .selectors import (
    get_group_members,
    get_group_member_by_id,
    get_group_member,
    is_owner,
    is_admin_or_owner,
)

from .services import (
    invite_member,
    accept_invitation,
    reject_invitation,
    remove_group_member,
    leave_group,
    transfer_ownership,
    update_member_role,
)


class GroupListCreateView(APIView):

    def get(self, request):
        groups = Group.objects.filter(
            memberships__user=request.user
        ).distinct()

        serializer = GroupSerializer(
            groups,
            many=True,
            context={"request": request},
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

class RemoveGroupMemberView(APIView):

    def delete(
        self,
        request,
        member_id,
    ):
        member = get_object_or_404(
            GroupMember,
            id=member_id,
        )

        try:
            remove_group_member(
                actor=request.user,
                member=member,
            )

            return success_response(
                message="Member removed",
            )

        except ValueError as e:
            return error_response(
                message=str(e),
            )

class LeaveGroupView(APIView):

    def post(
        self,
        request,
        group_id,
    ):
        group = get_object_or_404(
            Group,
            id=group_id,
        )

        try:
            leave_group(
                group=group,
                user=request.user,
            )

            return success_response(
                message="Left group successfully",
            )

        except ValueError as e:
            return error_response(
                message=str(e),
            )

class TransferOwnershipView(APIView):

    def post(
        self,
        request,
        group_id,
    ):
        group = get_object_or_404(
            Group,
            id=group_id,
        )

        serializer = (
            TransferOwnershipSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        target_user = get_object_or_404(
            User,
            id=serializer.validated_data[
                "user_id"
            ]
        )

        try:
            transfer_ownership(
                group=group,
                current_owner=request.user,
                target_member=target_user,
            )

            return success_response(
                message="Ownership transferred",
            )

        except ValueError as e:
            return error_response(
                message=str(e),
            )

class UpdateMemberRoleView(APIView):

    def patch(
        self,
        request,
        member_id,
    ):
        member = get_object_or_404(
            GroupMember,
            id=member_id,
        )

        serializer = (
            UpdateMemberRoleSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated_member = (
                update_member_role(
                    actor=request.user,
                    member=member,
                    role=serializer.validated_data[
                        "role"
                    ],
                )
            )

            return success_response(
                data=GroupMemberSerializer(
                    updated_member
                ).data,
                message="Role updated",
            )

        except ValueError as e:
            return error_response(
                message=str(e),
            )