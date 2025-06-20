# Generated by Django 5.1.7 on 2025-05-05 18:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0002_initial'),
        ('lessons', '0002_initial'),
        ('quizs', '0002_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='question',
            name='content_type',
        ),
        migrations.RemoveField(
            model_name='question',
            name='object_id',
        ),
        migrations.AddField(
            model_name='question',
            name='lesson',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='lessons.lesson'),
        ),
        migrations.AddField(
            model_name='question',
            name='quiz',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='quizs.quiz'),
        ),
        migrations.AddField(
            model_name='quiz',
            name='bob',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='courses.mymodules'),
        ),
    ]
