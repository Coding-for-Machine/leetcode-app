from django.db.models.signals import post_save
from django.dispatch import receiver
from solution.models import Solution
from .models import UserActivityDaily, UserStats, UserProblemStatus
from django.utils import timezone

@receiver(post_save, sender=Solution)
def solution_created_or_updated(sender, instance, created, **kwargs):
    """
    Bu signal yechim yaratish yoki yangilash vaqtida ishga tushadi.
    - Foydalanuvchining faoliyatini UserActivityDaily'ga yozadi.
    - Agar yechim qabul qilingan bo'lsa, UserProblemStatus orqali muammoni yakunlandi deb belgilaydi.
    - Foydalanuvchining statistikalarini yangilaydi.
    """
    try:
        if created:
            # Yangi yechim yaratilganda faoliyatni log qilish
            UserActivityDaily.log_activity(
                instance.user,
                activity_type='problem_solved',
                duration=instance.execution_time,  # Bu yerda kerakli bo'lsa vaqtni moslashtirishingiz mumkin
                score=instance.score
            )

            # Yechim qabul qilingan bo'lsa, muammoni yakunlandi deb belgilash
            # Foydalanuvchining statistikalarini yangilash
            if instance.is_accepted:
                UserProblemStatus.mark_completed(instance.user, instance.problem)
                UserStats.update_stats(instance.user)

        else:
            # Agar yechim yangilansa, statistikalarni yangilash
            # Yechim qabul qilingan bo'lsa, muammoni yakunlandi deb belgilash
            if instance.is_accepted:
                UserStats.update_stats(instance.user)
                UserProblemStatus.mark_completed(instance.user, instance.problem)
    except Exception as e:
        # Xatolik yuz bersa, uni log qilish yoki qayta ishlash
        print(f"Yechim yaratilganda yoki yangilanganda xatolik yuz berdi: {e}")
