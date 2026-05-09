from django.urls import path

from .views import GroupListCreateView

urlpatterns = [
    path("", GroupListCreateView.as_view()),
]