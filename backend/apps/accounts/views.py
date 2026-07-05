from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.storage import default_storage
import razorpay
from rest_framework.permissions import IsAuthenticated

from apps.common.responses import (
    success_response,
    error_response,
)

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    GoogleLoginSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .models import User
from .tasks import send_password_reset_email_task

from .services import (
    google_login,
)
from apps.accounts.models import SubscriptionPayment


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

    def patch(self, request):
        data = request.data.copy()

        if "avatar" in request.FILES:
            file_obj = request.FILES["avatar"]
            file_name = default_storage.save(f"avatars/{file_obj.name}", file_obj)
            data["avatar"] = request.build_absolute_uri(default_storage.url(file_name))

        serializer = UserSerializer(request.user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=serializer.data, message="Settings updated successfully"
        )


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]

        user = google_login(token)

        if not user:
            return error_response(message="Invalid Google token")

        refresh = RefreshToken.for_user(user)

        return success_response(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            message="Google login successful",
        )


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(old_password):
            return error_response(
                message="Invalid old password", status_code=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return success_response(message="Password changed successfully")


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = User.objects.filter(email=email).first()

        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
            reset_url = f"{frontend_url}/reset-password/{uidb64}/{token}"

            send_password_reset_email_task.delay(user.email, reset_url)

        return success_response(
            message="If an account with this email exists, a password reset link has been sent."
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        serializer = ResetPasswordSerializer(
            data={
                "uidb64": uidb64,
                "token": token,
                "new_password": request.data.get("new_password"),
            }
        )
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and PasswordResetTokenGenerator().check_token(user, token):
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return success_response(message="Password reset successfully")

        return error_response(
            message="Invalid or expired reset link",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class CreateSubscriptionOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.subscription_plan == "PRO":
            return error_response(
                message="Already subscribed to PRO plan", status_code=400
            )

        key_id = getattr(settings, "RAZORPAY_KEY_ID", None)
        key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", None)

        if not key_id or not key_secret:
            return error_response(message="Razorpay not configured", status_code=500)

        client = razorpay.Client(auth=(key_id, key_secret))

        amount = 49900  # ₹499
        data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"receipt_{request.user.id}",
        }

        try:
            payment = client.order.create(data=data)
            return success_response(
                data={"order_id": payment["id"], "amount": amount, "key_id": key_id},
                message="Order created",
            )
        except Exception as e:
            return error_response(message=str(e), status_code=500)


class VerifySubscriptionPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return error_response(message="Missing payment details", status_code=400)

        key_id = getattr(settings, "RAZORPAY_KEY_ID", None)
        key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", None)

        client = razorpay.Client(auth=(key_id, key_secret))

        try:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": razorpay_order_id,
                    "razorpay_payment_id": razorpay_payment_id,
                    "razorpay_signature": razorpay_signature,
                }
            )

            # Payment is verified
            SubscriptionPayment.objects.create(
                user=request.user,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
                amount=499.00,
            )
            request.user.subscription_plan = "PRO"
            request.user.save()
            return success_response(
                message="Subscription upgraded to PRO successfully",
                data=UserSerializer(request.user).data,
            )
        except Exception as e:
            return error_response(
                message="Invalid signature or payment verification failed",
                status_code=400,
            )
