from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=60,
    retry_backoff_max=7200,
    max_retries=20,
)
def send_password_reset_email_task(email, reset_url):
    logger.info(f"Preparing to send password reset email to {email}")
    
    try:
        send_mail(
            subject="Reset your password",
            message=f"Click the link to reset your password: {reset_url}",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"),
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"Successfully sent password reset email to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        raise e

