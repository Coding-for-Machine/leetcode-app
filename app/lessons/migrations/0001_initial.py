# Generated by Django 5.1.7 on 2025-04-15 05:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('courses', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Lesson',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(db_index=True, max_length=255)),
                ('slug', models.SlugField(unique=True)),
                ('lesson_type', models.CharField(choices=[('darslik', 'darslik'), ('probelm', 'probelm')], max_length=50)),
                ('preview', models.BooleanField(default=False)),
                ('module', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson', to='courses.mymodules')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
