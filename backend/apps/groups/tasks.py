from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

from django.template.loader import render_to_string
from django.utils.html import strip_tags

@shared_task
def send_invitation_email_task(invitation_id):
    from apps.groups.models import GroupInvitation
    try:
        invitation = GroupInvitation.objects.select_related('group', 'invited_by').get(id=invitation_id)
        
        subject = f"You've been invited to join {invitation.group.name} on Expenzo"
        
        context = {
            'inviter_name': invitation.invited_by.full_name,
            'group_name': invitation.group.name,
            'action_url': f"{settings.FRONTEND_URL}/groups/{invitation.group.id}",
        }
        
        html_message = render_to_string('emails/invitation.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Invitation email sent to {invitation.email}")
    except GroupInvitation.DoesNotExist:
        logger.error(f"Invitation with id {invitation_id} not found")
    except Exception as e:
        logger.error(f"Failed to send invitation email: {str(e)}")


@shared_task
def send_role_update_email_task(member_id):
    from apps.groups.models import GroupMember
    try:
        member = GroupMember.objects.get(id=member_id)
        
        subject = f"Your role in {member.group.name} has been updated"
        message = (
            f"Hello {member.user.full_name},\n\n"
            f"Your role in the group '{member.group.name}' has been updated to: {member.role}.\n\n"
            f"Thanks,\nThe Expanzo Team"
        )
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[member.user.email],
            fail_silently=False,
        )
        logger.info(f"Role update email sent to {member.user.email}")
    except GroupMember.DoesNotExist:
        logger.error(f"GroupMember with id {member_id} not found")
    except Exception as e:
        logger.error(f"Failed to send role update email: {str(e)}")
