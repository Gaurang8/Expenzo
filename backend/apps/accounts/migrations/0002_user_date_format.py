from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='date_format',
            field=models.CharField(choices=[('MM/dd/yyyy', 'MM/DD/YYYY'), ('dd/MM/yyyy', 'DD/MM/YYYY'), ('yyyy-MM-dd', 'YYYY-MM-DD'), ('dd MMM yyyy', '12 May 2025'), ('MMM dd, yyyy', 'May 12, 2025')], default='MMM dd, yyyy', max_length=20),
        ),
    ]
