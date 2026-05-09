from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    MeView,
    GoogleLoginView
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/",LoginView.as_view()),
    path("me/",MeView.as_view()),
    path("google-login/",GoogleLoginView.as_view()),
]