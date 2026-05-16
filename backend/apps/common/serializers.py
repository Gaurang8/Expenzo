from rest_framework import serializers

class UserInfoSerializer(serializers.Serializer):
    """Reusable nested user info block. Attach with source='user' or similar."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(source="full_name", read_only=True)
    email = serializers.EmailField(read_only=True)
