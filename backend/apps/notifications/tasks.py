from celery import shared_task
from django.core.mail import send_mail, get_connection, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

from .models import Notification
from apps.accounts.models import User
from apps.common.constants import CELERY_RETRY_KWARGS
from apps.common.utils import send_templated_email

logger = logging.getLogger(__name__)

TEMPLATE_MAP = {
    'expense_added': 'emails/expense_added.html',
    'settlement_confirmed': 'emails/settlement_received.html',
    'ownership_transfer': 'emails/ownership_transfer.html',
    'role_change': 'emails/membership_update.html',
    'member_removed': 'emails/membership_update.html',
    'member_left': 'emails/membership_update.html',
}


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
    Creates an in-app Notification record and optionally triggers a specialized email alert.
    Used for single-recipient notifications (settlements, role changes, etc.).
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
            send_notification_email_task.delay(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                link=link,
                email_subject=email_subject,
                extra_context=extra_context
            )

    except User.DoesNotExist:
        logger.error(f"User with id {user_id} not found")
    except Exception as e:
        logger.error(f"Failed to process notification for user {user_id}: {str(e)}")


@shared_task(**CELERY_RETRY_KWARGS)
def send_notification_email_task(
    user_id,
    notification_type,
    title,
    message,
    link=None,
    email_subject=None,
    extra_context=None
):
    """
    Sends a single notification email. Retries on failure.
    Used for single-recipient flows (settlements, role changes, etc.).
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User with id {user_id} not found, skipping email.")
        return

    template_name = TEMPLATE_MAP.get(notification_type, 'emails/notification.html')

    context = {
        'notification_title': title,
        'notification_message': message,
        'action_url': f"{settings.FRONTEND_URL}{link}" if link else settings.FRONTEND_URL,
        'site_url': settings.FRONTEND_URL,
        **(extra_context or {})
    }

    subject = email_subject or title
    send_templated_email(subject, template_name, context, [user.email])


@shared_task(**CELERY_RETRY_KWARGS)
def send_batch_notifications_task(
    notifications_data,
    send_email=True,
):
    """
    Creates in-app Notification records in bulk and sends all emails via a
    single SMTP connection. Used for multi-recipient events (e.g. expense added).

    notifications_data: list of dicts, each with keys:
        user_id, notification_type, title, message, link,
        email_subject (optional), extra_context (optional)
    """
    # ── Step 1: Bulk-create in-app notifications ──
    user_ids = [n['user_id'] for n in notifications_data]
    users_map = {u.id: u for u in User.objects.filter(id__in=user_ids)}

    notification_objects = []
    for n in notifications_data:
        user = users_map.get(n['user_id'])
        if not user:
            logger.error(f"User with id {n['user_id']} not found, skipping.")
            continue
        notification_objects.append(
            Notification(
                user=user,
                type=n['notification_type'],
                title=n['title'],
                message=n['message'],
                link=n.get('link'),
            )
        )

    Notification.objects.bulk_create(notification_objects)
    logger.info(f"Bulk-created {len(notification_objects)} in-app notifications.")

    if not send_email:
        return

    # ── Step 2: Batch-send emails via single SMTP connection ──
    email_messages = []
    for n in notifications_data:
        user = users_map.get(n['user_id'])
        if not user:
            continue

        notification_type = n['notification_type']
        template_name = TEMPLATE_MAP.get(notification_type, 'emails/notification.html')

        context = {
            'notification_title': n['title'],
            'notification_message': n['message'],
            'action_url': f"{settings.FRONTEND_URL}{n.get('link', '')}" if n.get('link') else settings.FRONTEND_URL,
            'site_url': settings.FRONTEND_URL,
            **(n.get('extra_context') or {})
        }

        subject = n.get('email_subject') or n['title']
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_message, "text/html")
        email_messages.append(msg)

    if not email_messages:
        return

    connection = get_connection()
    try:
        connection.open()
        sent = connection.send_messages(email_messages)
        logger.info(f"Batch-sent {sent}/{len(email_messages)} notification emails via single SMTP connection.")
    except Exception as e:
        logger.error(f"Batch email sending failed: {str(e)}")
        raise e
    finally:
        connection.close()

