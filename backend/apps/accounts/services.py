from google.auth.transport import requests
from google.oauth2 import id_token

from django.conf import settings

from .models import User


def google_login(id_token_str):
    try:
        google_data = id_token.verify_oauth2_token(
            id_token_str,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )

        email = google_data["email"]
        full_name = google_data.get("name", "")

        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": full_name,
            }
        )

        return user

    except Exception:
        return None