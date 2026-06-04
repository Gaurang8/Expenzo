from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    MeView,
    GoogleLoginView,
    ChangePasswordView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/",LoginView.as_view()),
    path("me/",MeView.as_view()),
    path("google-login/",GoogleLoginView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/<str:uidb64>/<str:token>/", ResetPasswordView.as_view()),
]