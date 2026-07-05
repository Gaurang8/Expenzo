from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
from apps.groups.models import Group

class AIChatMessage(BaseModel):
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    group = models.ForeignKey(
        Group, 
        on_delete=models.CASCADE, 
        related_name="ai_chat_messages"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_chat_messages",
        help_text="The user who sent the message (or to whom the assistant is replying)."
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField(help_text="The textual content of the message.")
    expense_payload = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Structured JSON of a proposed expense, if applicable."
    )
    settlement_payload = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Structured JSON of a proposed settlement, if applicable."
    )
    is_actioned = models.BooleanField(
        default=False,
        help_text="True if the user has already confirmed or acted on this AI proposal."
    )

    class Meta:
        ordering = ["created_at"]
        verbose_name = "AI Chat Message"
        verbose_name_plural = "AI Chat Messages"

    def __str__(self):
        return f"{self.role.capitalize()} message in {self.group.name}"


class AIDashboardHistory(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dashboard_history",
        help_text="The user who generated this dashboard."
    )
    prompt = models.TextField(
        help_text="The natural language prompt that generated this dashboard."
    )
    dashboard_data = models.JSONField(
        help_text="The structured layout and widget data for the dashboard."
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "AI Dashboard History"
        verbose_name_plural = "AI Dashboard Histories"

    def __str__(self):
        return f"Dashboard for {self.user.email} on {self.created_at.strftime('%Y-%m-%d')}"
