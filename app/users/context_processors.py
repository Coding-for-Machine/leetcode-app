from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from .models import Profile

def auth_profile(request):
    context = {}
    
    if not isinstance(request.user, AnonymousUser):
        profile, created = Profile.objects.get_or_create(user=request.user)
        context.update({
            'user_profile': profile,
            'is_premium_user': profile.is_premium,  # @property bilan ishlaydi
        })
    
    return context