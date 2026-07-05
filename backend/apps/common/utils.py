from decimal import Decimal

import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import csv
from django.http import HttpResponse

logger = logging.getLogger(__name__)


def round_currency(amount):
    return round(Decimal(amount), 2)


def export_csv(queryset, columns, filename, mapper=None):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(columns)

    for obj in queryset:
        if mapper:
            row = mapper(obj)
        else:
            row = [getattr(obj, col, "") for col in columns]
        writer.writerow(row)

    return response


def send_templated_email(
    subject, template_name, context, recipient_list, from_email=None
):
    """
    Renders an HTML template, generates a plain text fallback, and sends the email.
    """
    html_message = render_to_string(template_name, context)
    plain_message = strip_tags(html_message)
    sender = from_email or settings.DEFAULT_FROM_EMAIL

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=sender,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Email '{subject}' sent to {recipient_list}")
    except Exception as e:
        logger.error(f"Failed to send email '{subject}' to {recipient_list}: {str(e)}")
        raise e
