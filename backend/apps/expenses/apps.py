from django.apps import AppConfig


class ExpensesConfig(AppConfig):
    name = 'apps.expenses'

    def ready(self):
        import apps.expenses.signals
