from decimal import Decimal


def round_currency(amount):
    return round(Decimal(amount), 2)