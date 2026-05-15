from django.db import models


class SplitType(models.TextChoices):
    EQUAL = "equal", "Equal"
    EXACT = "exact", "Exact"
    PERCENTAGE = "percentage", "Percentage"