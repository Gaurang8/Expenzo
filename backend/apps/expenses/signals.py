from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.expenses.models import Expense
from apps.ai.tasks import generate_expense_embedding

@receiver(post_save, sender=Expense)
def trigger_embedding_generation(sender, instance, created, update_fields, **kwargs):
    # Avoid infinite recursion when the task saves the embedding field
    if update_fields and 'embedding' in update_fields and len(update_fields) == 1:
        return
        
    # Trigger celery task asynchronously
    generate_expense_embedding.delay(instance.id)
