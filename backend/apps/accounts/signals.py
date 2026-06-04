from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from .models import User
from apps.groups.tasks import delete_avatar_file_task

@receiver(post_delete, sender=User)
def cleanup_user_avatar_on_delete(sender, instance, **kwargs):
    if instance.avatar:
        delete_avatar_file_task.delay(instance.avatar)

@receiver(pre_save, sender=User)
def cleanup_user_avatar_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return
    
    try:
        old_instance = User.objects.get(pk=instance.pk)
    except User.DoesNotExist:
        return

    if old_instance.avatar and old_instance.avatar != instance.avatar:
        delete_avatar_file_task.delay(old_instance.avatar)
