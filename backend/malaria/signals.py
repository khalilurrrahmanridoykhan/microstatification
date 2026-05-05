from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from malaria.models import MalariaUserRole


@receiver(post_save, sender=User)
def sync_malaria_user_role_from_main_role(sender, instance, **kwargs):
    """Keep malaria.MalariaUserRole aligned with main User.role for field roles (SPO/DM)."""
    if not instance.is_active:
        return
    existing = getattr(instance, "malaria_role", None)
    if existing and existing.role == MalariaUserRole.ROLE_ADMIN:
        return
    role = getattr(instance, "role", None)
    if role in (8, 9, 11):
        MalariaUserRole.objects.update_or_create(user=instance, defaults={"role": MalariaUserRole.ROLE_SPO})
    elif role == 10:
        MalariaUserRole.objects.update_or_create(user=instance, defaults={"role": MalariaUserRole.ROLE_DM})
