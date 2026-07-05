from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.core.files.storage import default_storage
from urllib.parse import urlparse
import logging
from apps.common.constants import CELERY_RETRY_KWARGS
from apps.common.utils import send_templated_email

logger = logging.getLogger(__name__)

from apps.groups.models import GroupInvitation, GroupMember

@shared_task(**CELERY_RETRY_KWARGS)
def send_invitation_email_task(invitation_id):
    try:
        invitation = GroupInvitation.objects.select_related('group', 'invited_by').get(id=invitation_id)
    except GroupInvitation.DoesNotExist:
        logger.error(f"Invitation with id {invitation_id} not found")
        return

    subject = f"You've been invited to join {invitation.group.name} on Expenzo"
    context = {
        'inviter_name': invitation.invited_by.full_name,
        'group_name': invitation.group.name,
        'action_url': f"{settings.FRONTEND_URL}/groups/{invitation.group.id}",
    }
    
    send_templated_email(subject, 'emails/invitation.html', context, [invitation.email])


@shared_task(**CELERY_RETRY_KWARGS)
def send_role_update_email_task(member_id):
    try:
        member = GroupMember.objects.get(id=member_id)
    except GroupMember.DoesNotExist:
        logger.error(f"GroupMember with id {member_id} not found")
        return
        
    subject = f"Your role in {member.group.name} has been updated"
    message = (
        f"Hello {member.user.full_name},\n\n"
        f"Your role in the group '{member.group.name}' has been updated to: {member.role}.\n\n"
        f"Thanks,\nThe Expanzo Team"
    )
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[member.user.email],
            fail_silently=False,
        )
        logger.info(f"Role update email sent to {member.user.email}")
    except Exception as e:
        logger.error(f"Failed to send role update email: {str(e)}")
        raise e



@shared_task
def delete_avatar_file_task(avatar_url):
    if not avatar_url:
        return
    path = urlparse(avatar_url).path
    if path.startswith(settings.MEDIA_URL):
        relative_path = path[len(settings.MEDIA_URL):]
        if relative_path and default_storage.exists(relative_path):
            try:
                default_storage.delete(relative_path)
                logger.info(f"Deleted orphaned avatar file: {relative_path}")
            except Exception as e:
                logger.error(f"Failed to delete orphaned avatar file {relative_path}: {str(e)}")

