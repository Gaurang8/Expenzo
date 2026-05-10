from rest_framework import serializers

from .models import (
    Group,
    GroupMember,
    GroupInvitation
)


class GroupSerializer(serializers.ModelSerializer):

    class Meta:
        model = Group
        fields = (
            "id",
            "name",
            "description",
            "created_at",
        )


class GroupMemberSerializer(serializers.ModelSerializer):

    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    full_name = serializers.CharField(
        source="user.full_name",
        read_only=True,
    )

    class Meta:
        model = GroupMember
        fields = (
            "id",
            "user",
            "user_email",
            "full_name",
            "role",
            "joined_at",
        )

class GroupInvitationSerializer(
    serializers.ModelSerializer
):
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

class InviteMemberSerializer(
    serializers.Serializer
):
    email = serializers.EmailField()