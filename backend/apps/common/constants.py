MAX_GROUP_NAME_LENGTH = 255
DEFAULT_CURRENCY = "INR"

CELERY_RETRY_KWARGS = {
    "autoretry_for": (Exception,),
    "retry_backoff": 60,
    "retry_backoff_max": 7200,
    "max_retries": 20,
}