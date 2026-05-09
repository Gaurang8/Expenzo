from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.responses import (
    success_response,
)

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return success_response(
            data=UserSerializer(user).data,
            message="User registered successfully",
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return success_response(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            message="Login successful",
        )


class MeView(APIView):
    def get(self, request):
        return success_response(
            data=UserSerializer(request.user).data,
            message="User fetched successfully",
        )

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]

        user = google_login(token)

        if not user:
            return error_response(
                message="Invalid Google token"
            )

        refresh = RefreshToken.for_user(user)

        return success_response(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            message="Google login successful",
        )