from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from apps.common.responses import success_response, error_response
from apps.common.throttling import AILimitPerMinute, AILimitPerDay
from apps.groups.models import Group, GroupMember
from .models import AIChatMessage
from .client import ai_service

def is_group_member(group, user):
    return GroupMember.objects.filter(group=group, user=user).exists()

class AIChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        if request.user.subscription_plan != "PRO":
            return error_response(message="Upgrade to PRO to access AI features", status_code=403)
            
        group = get_object_or_404(Group, id=group_id)
        if not is_group_member(group, request.user):
            return error_response(message="You are not a group member", status_code=403)

        messages = AIChatMessage.objects.filter(group=group, user=request.user).order_by("created_at")
        
        data = []
        for msg in messages:
            data.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "expense_payload": msg.expense_payload,
                "settlement_payload": msg.settlement_payload,
                "is_actioned": msg.is_actioned,
                "created_at": msg.created_at.isoformat()
            })
            
        return success_response(data=data, message="Chat history fetched successfully")


class AIChatMessageView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AILimitPerMinute, AILimitPerDay]

    def post(self, request, group_id):
        if request.user.subscription_plan != "PRO":
            return error_response(message="Upgrade to PRO to access AI features", status_code=403)
            
        group = get_object_or_404(Group, id=group_id)
        if not is_group_member(group, request.user):
            return error_response(message="You are not a group member", status_code=403)

        content = request.data.get("content", "").strip()
        if not content:
            return error_response(message="Message content is required", status_code=400)

        # 1. Save user message
        user_msg = AIChatMessage.objects.create(
            group=group,
            user=request.user,
            role="user",
            content=content
        )

        # 2. Get history (last 10 messages for context)
        recent_messages = AIChatMessage.objects.filter(
            group=group, 
            user=request.user
        ).order_by("-created_at")[:10]
        recent_messages = reversed(recent_messages) # chronological

        history = [{"role": m.role, "content": m.content} for m in recent_messages if m.id != user_msg.id]

        # 3. Get group members info
        members = GroupMember.objects.filter(group=group).select_related("user")
        group_members_info = [
            {"id": m.user.id, "name": m.user.full_name, "email": m.user.email} 
            for m in members
        ]

        # 4. Call AI Agent
        ai_res = ai_service.chat_with_agent(
            user_message=content,
            current_user_id=request.user.id,
            group_members_info=group_members_info,
            history=history,
            group_id=group.id
        )

        # 5. Save AI response
        ai_msg = AIChatMessage.objects.create(
            group=group,
            user=request.user,
            role="assistant",
            content=ai_res.get("reply", "I'm not sure."),
            expense_payload=ai_res.get("expense_data"),
            settlement_payload=ai_res.get("settlement_data")
        )

        return success_response(data={
            "user_message": {
                "id": user_msg.id,
                "role": user_msg.role,
                "content": user_msg.content,
                "created_at": user_msg.created_at.isoformat()
            },
            "assistant_message": {
                "id": ai_msg.id,
                "role": ai_msg.role,
                "content": ai_msg.content,
                "expense_payload": ai_msg.expense_payload,
                "settlement_payload": ai_msg.settlement_payload,
                "created_at": ai_msg.created_at.isoformat()
            }
        }, message="Message sent successfully")

class AIChatMessageActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, group_id, message_id):
        group = get_object_or_404(Group, id=group_id)
        if not is_group_member(group, request.user):
            return error_response(message="You are not a group member", status_code=403)

        msg = get_object_or_404(AIChatMessage, id=message_id, group=group, user=request.user)
        msg.is_actioned = True
        msg.save()

        return success_response(data={"id": msg.id, "is_actioned": msg.is_actioned}, message="Message marked as actioned")


class AIDashboardGenerateView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AILimitPerMinute, AILimitPerDay]

    def post(self, request):
        if request.user.subscription_plan != "PRO":
            return error_response(message="Upgrade to PRO to access AI features", status_code=403)
            
        prompt = request.data.get("prompt", "").strip()
        if not prompt:
            return error_response(message="Prompt is required", status_code=400)

        dashboard_data = ai_service.analyze_dashboard(prompt, request.user.id)
        
        return success_response(
            data=dashboard_data, 
            message="Dashboard generated successfully"
        )


class AIDashboardHistoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.subscription_plan != "PRO":
            return error_response(message="Upgrade to PRO to access AI features", status_code=403)
            
        from .models import AIDashboardHistory
        history = AIDashboardHistory.objects.filter(user=request.user).order_by("-created_at")
        data = [
            {
                "id": item.id,
                "prompt": item.prompt,
                "dashboard_data": item.dashboard_data,
                "created_at": item.created_at.isoformat()
            }
            for item in history
        ]
        return success_response(data=data, message="Dashboard history fetched")

    def post(self, request):
        if request.user.subscription_plan != "PRO":
            return error_response(message="Upgrade to PRO to access AI features", status_code=403)
            
        from .models import AIDashboardHistory
        prompt = request.data.get("prompt")
        dashboard_data = request.data.get("dashboard_data")

        if not prompt or not dashboard_data:
            return error_response(message="Prompt and dashboard_data are required", status_code=400)

        history_item = AIDashboardHistory.objects.create(
            user=request.user,
            prompt=prompt,
            dashboard_data=dashboard_data
        )

        return success_response(
            data={
                "id": history_item.id,
                "prompt": history_item.prompt,
                "created_at": history_item.created_at.isoformat()
            },
            message="Dashboard saved to history"
        )
