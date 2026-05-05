from django.apps import AppConfig


class MalariaConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "malaria"

    def ready(self):
        # noqa: F401 — register signal receivers
        import malaria.signals  # pylint: disable=unused-import

