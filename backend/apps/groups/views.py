from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.common.responses import error_response, success_response

from .models import Group, GroupInvitation, GroupMember
from .selectors import (
    get_group_member,
    get_group_member_by_id,
    get_group_members,
    is_admin_or_owner,
    is_owner,
    has_setting_permission,
)
from .serializers import (
    GroupInvitationSerializer,
    GroupMemberSerializer,
    GroupSerializer,
    InviteMemberSerializer,
    TransferOwnershipSerializer,
    UpdateMemberRoleSerializer,
)
from .services import (
    accept_invitation,
    create_group,
    invite_member,
    leave_group,
    reject_invitation,
    remove_group_member,
    transfer_ownership,
    update_member_role,
    delete_group,
)


class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GroupSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'group_id'

    def get_queryset(self):
        user = self.request.user
        prefetch_membership = Prefetch(
            'memberships',
            queryset=GroupMember.objects.filter(user=user),
            to_attr='user_membership'
        )
        return Group.objects.filter(
            memberships__user=user
        ).prefetch_related(prefetch_membership).distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message="Groups fetched successfully",
        )

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        if 'avatar' in request.FILES:
            file_obj = request.FILES['avatar']
            file_name = default_storage.save(f"uploads/{file_obj.name}", file_obj)
            data['avatar'] = request.build_absolute_uri(default_storage.url(file_name))
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        group = create_group(
            user=request.user,
            **serializer.validated_data,
        )

        return success_response(
            data=GroupSerializer(group, context={"request": request}).data,
            message="Group created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        membership = GroupMember.objects.filter(group=instance, user=request.user).first()
        if not membership:
            return error_response(message="Permission denied")

        data = request.data.copy()
        
        if 'settings' in data:
            if membership.role not in ["owner", "admin"]:
                return error_response(message="Permission denied")
        else:
            if not has_setting_permission(membership.role, instance.settings.get("update_group", "admin")):
                return error_response(message="Permission denied")
        
        if 'avatar' in request.FILES:
            file_obj = request.FILES['avatar']
            file_name = default_storage.save(f"uploads/{file_obj.name}", file_obj)
            data['avatar'] = request.build_absolute_uri(default_storage.url(file_name))

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return success_response(
            data=serializer.data,
            message="Group updated successfully"
        )

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()
        try:
            delete_group(group=group, user=request.user)
            return success_response(message="Group deleted successfully")
        except ValueError as e:
            return error_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'])
    def invite(self, request, group_id=None):
        group = self.get_object()

        membership = GroupMember.objects.filter(group=group, user=request.user).first()
        if not membership or not has_setting_permission(membership.role, group.settings.get("invite_members", "admin")):
            return error_response(message="Permission denied")

        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            invitation = invite_member(
                group=group,
                invited_by=request.user,
                email=serializer.validated_data["email"],
            )
            return success_response(
                data=GroupInvitationSerializer(invitation).data,
                message="Invitation sent",
            )
        except ValueError as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['get'])
    def members(self, request, group_id=None):
        group = self.get_object()
        members = get_group_members(group)
        serializer = GroupMemberSerializer(members, many=True)
        return success_response(data=serializer.data, message="Members fetched")

    @action(detail=True, methods=['get'])
    def invitations(self, request, group_id=None):
        group = self.get_object()
        invitations = group.invitations.filter(status="pending")
        serializer = GroupInvitationSerializer(invitations, many=True)
        return success_response(data=serializer.data, message="Invitations fetched")

    @action(detail=True, methods=['post'])
    def leave(self, request, group_id=None):
        group = self.get_object()
        try:
            leave_group(group=group, user=request.user)
            return success_response(message="Left group successfully")
        except ValueError as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['post'], url_path='transfer-ownership')
    def transfer_ownership(self, request, group_id=None):
        group = self.get_object()
        serializer = TransferOwnershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user = get_object_or_404(
            User, id=serializer.validated_data["user_id"]
        )

        try:
            transfer_ownership(
                group=group,
                current_owner=request.user,
                target_member=target_user,
            )
            return success_response(message="Ownership transferred")
        except ValueError as e:
            return error_response(message=str(e))




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





class UserInvitationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = GroupInvitation.objects.filter(
            email=request.user.email,
            status="pending"
        ).select_related('group').order_by("-created_at")

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
