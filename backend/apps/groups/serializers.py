from rest_framework import serializers

from .models import Group, GroupMember, GroupInvitation

from .enums import GroupRole
from .services import build_group_permissions

from apps.common.serializers import UserInfoSerializer


class GroupSerializer(serializers.ModelSerializer):

    permissions = serializers.SerializerMethodField()

    current_user_role = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = (
            "id",
            "name",
            "description",
            "created_at",
            "permissions",
            "current_user_role",
        )

    def get_current_user_role(self, obj):
        if hasattr(obj, 'user_membership') and obj.user_membership:
            return obj.user_membership[0].role
            
        request = self.context.get("request")
        if not request:
            return None
        membership = GroupMember.objects.filter(group=obj, user=request.user).first()
        return membership.role if membership else None

    def get_permissions(self, obj):
        if hasattr(obj, 'user_membership') and obj.user_membership:
            return build_group_permissions(obj.user_membership[0])
            
        request = self.context.get("request")
        if not request:
            return {}
        membership = GroupMember.objects.filter(group=obj, user=request.user).first()
        if not membership:
            return {}
        return build_group_permissions(membership)


class GroupMemberSerializer(serializers.ModelSerializer):

    user_info = UserInfoSerializer(source="user", read_only=True)

    class Meta:
        model = GroupMember
        fields = (
            "id",
            "user",
            "user_info",
            "role",
            "joined_at",
        )


class GroupInvitationSerializer(serializers.ModelSerializer):

    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = GroupInvitation
        fields = (
            "id",
            "group",
            "group_name",
            "email",
            "status",
            "created_at",
        )


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()


class UpdateMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=GroupRole.choices)


class TransferOwnershipSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
