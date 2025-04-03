
# from django.dispatch import receiver
# from django.db.models.signals import post_save
# from solution.models import Solution
# from userstatus.models import UserActivityDaily, UserProblemStatus


# @receiver(post_save, sender=UserActivityDaily)
# @receiver(post_save, sender=UserProblemStatus)
# @receiver(post_save, sender=Solution)
# def update_leaderboard_signal(sender, instance, **kwargs):
#     UserLeaderboard.update_leaderboard(instance.user)