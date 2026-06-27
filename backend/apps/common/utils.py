from decimal import Decimal


def round_currency(amount):
    return round(Decimal(amount), 2)

import csv
from django.http import HttpResponse

def export_csv(queryset, columns, filename, mapper=None):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    writer = csv.writer(response)
    writer.writerow(columns)
    
    for obj in queryset:
        if mapper:
            row = mapper(obj)
        else:
            row = [getattr(obj, col, '') for col in columns]
        writer.writerow(row)
        
    return response