from rest_framework.views import APIView
from rest_framework import status

from apps.common.responses import (
    success_response,
)

from .models import Group
from .serializers import GroupSerializer
from .services import create_group


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