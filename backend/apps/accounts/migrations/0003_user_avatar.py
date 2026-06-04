from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_date_format'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='avatar',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
