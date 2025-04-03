from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver

from contest.models import ContestRegistration
from .models import Profile, MyUser
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q

teacher_permissions = [
    "view_problems", "view_testcase", "view_course", "view_mymodule",
    "view_lesson", "view_profile", "view_comments", "view_question",
    "view_quiz", "view_answer", "add_userquizresult", "view_certificate"
]

@receiver(post_migrate)
def create_default_groups(sender, **kwargs):
    groups = ["Student", "Teacher", "Staff", "Superuser"]
    for group_name in groups:
        group, created = Group.objects.get_or_create(name=group_name)
        if created:
            print(f"Guruh yaratildi: {group_name}")
    student_group, _ = Group.objects.get_or_create(name="Student")
    view_permissions = Permission.objects.filter(Q(codename__startswith="view_"))
    student_group.permissions.set(view_permissions)
    print("Student guruhiga barcha ko'rish ruxsatlari berildi.")

    teacher_group, _ = Group.objects.get_or_create(name="Teacher")
    teacher_perms = Permission.objects.filter(codename__in=teacher_permissions)
    teacher_group.permissions.set(teacher_perms)
    print("Teacher guruhiga ma'lum ruxsatlar berildi.")

    staff_group, _ = Group.objects.get_or_create(name="Staff")
    admin_permissions = Permission.objects.filter(content_type__app_label="admin")
    staff_group.permissions.set(admin_permissions)
    print("Staff guruhiga admin ruxsatlari berildi.")

    superuser_group, _ = Group.objects.get_or_create(name="Superuser")
    all_permissions = Permission.objects.all()
    superuser_group.permissions.set(all_permissions)
    print("Superuser guruhiga barcha ruxsatlar berildi.")

@receiver(post_save, sender=MyUser)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(
            user=instance,
            first_name=instance.first_name or '',
            last_name=instance.last_name or ''
        )
        print(f"Yangi profil yaratildi: {instance.email}")
    else:
        profile, _ = Profile.objects.get_or_create(user=instance)
        profile.first_name = instance.first_name
        profile.last_name = instance.last_name
        profile.save()
        print(f"Profil yangilandi: {instance.email}")


@receiver(post_save, sender=MyUser)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


@receiver(post_save, sender=ContestRegistration)
def update_user_stats(sender, instance, created, **kwargs):
    if created or instance.rank is not None or instance.points is not None:
        user = instance.user
        user.update_contest_stats()