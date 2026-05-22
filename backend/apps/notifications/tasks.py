from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

from .models import Notification
from apps.accounts.models import User

logger = logging.getLogger(__name__)

@shared_task
def send_notification_task(
    user_id,
    notification_type,
    title,
    message,
    link=None,
    send_email=True,
    email_subject=None,
    extra_context=None
):
    """
    Creates an in-app Notification record and optionally sends a specialized email alert.
    """
    try:
        user = User.objects.get(id=user_id)
        
        Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            link=link
        )
        logger.info(f"Notification created for {user.email}: {title}")

        if send_email:
            template_map = {
                'expense_added': 'emails/expense_added.html',
                'settlement_confirmed': 'emails/settlement_received.html',
                'ownership_transfer': 'emails/ownership_transfer.html',
                'role_change': 'emails/membership_update.html',
                'member_removed': 'emails/membership_update.html',
                'member_left': 'emails/membership_update.html',
            }
            
            template_name = template_map.get(notification_type, 'emails/notification.html')
            
            context = {
                'notification_title': title,
                'notification_message': message,
                'action_url': f"{settings.FRONTEND_URL}{link}" if link else settings.FRONTEND_URL,
                'site_url': settings.FRONTEND_URL,
                **(extra_context or {})
            }
            
            subject = email_subject or title
            html_message = render_to_string(template_name, context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Notification email ({notification_type}) sent to {user.email}")

    except User.DoesNotExist:
        logger.error(f"User with id {user_id} not found")

    except Exception as e:
        logger.error(f"Failed to process notification for user {user_id}: {str(e)}")
