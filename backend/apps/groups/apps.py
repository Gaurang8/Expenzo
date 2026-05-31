from django.apps import AppConfig


class GroupsConfig(AppConfig):
    name = 'apps.groups'

    def ready(self):
        import apps.groups.signals
