from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.db.models import Avg, Sum, Min, Max
from contest.models import UserContestStats

class MyUserManager(BaseUserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email maydoni talab qilinadi!")
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        assert extra_fields.get("is_staff") is True, "Superuser uchun `is_staff=True` bo‘lishi shart!"
        assert extra_fields.get("is_superuser") is True, "Superuser uchun `is_superuser=True` bo‘lishi shart!"

        return self.create_user(email, password, **extra_fields)


class MyUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("staff", "Staff"),
        ("superuser", "Superuser"),
    ]
    username = models.CharField(max_length=250, unique=True, db_index=True)  # "username" deb t
    email = models.EmailField(unique=True, verbose_name="Email manzil")
    first_name = models.CharField(max_length=30, blank=True, null=True, verbose_name="Ism")
    last_name = models.CharField(max_length=30, blank=True, null=True, verbose_name="Familiya")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    is_staff = models.BooleanField(default=False, verbose_name="Xodim")
    is_deleted = models.BooleanField(default=False, verbose_name="O‘chirilgan")  # Soft delete
    primary_group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, related_name="primary_users")
    supplementary_groups = models.ManyToManyField(Group, blank=True, related_name="extra_users")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")

    objects = MyUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()

    def restore(self):
        self.is_deleted = False
        self.save()

    def __str__(self):
        return self.email
    
    def update_contest_stats(self):
        """
        Foydalanuvchi statistikasini avtomatik yangilaydi
        """
        stats, created = UserContestStats.objects.get_or_create(user=self)
        
        registrations = self.user_contest_register.all()
        
        if registrations.exists():
            stats.total_contests = registrations.count()
            stats.best_rank = registrations.aggregate(Min('rank'))['rank__min']
            stats.average_rank = registrations.aggregate(Avg('rank'))['rank__avg']
            stats.total_points = registrations.aggregate(Sum('points'))['points__sum'] or 0
            stats.last_contest = registrations.latest('contest__start_time').contest
        else:
            stats.total_contests = 0
            stats.best_rank = None
            stats.average_rank = None
            stats.total_points = 0
            stats.last_contest = None
        
        stats.save()
        
    class Meta:
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_new = self.pk is None  
        super().save(*args, **kwargs)
        group, _ = Group.objects.get_or_create(name=self.role.capitalize())
        self.primary_group = group
        self.groups.set([group]) 

        if self.is_staff:
            staff_group, _ = Group.objects.get_or_create(name="Staff")
            self.supplementary_groups.add(staff_group)
            self.groups.add(staff_group)

        if self.is_superuser:
            all_groups = Group.objects.all()
            self.supplementary_groups.set(all_groups)
            self.groups.set(all_groups)


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, verbose_name="Foydalanuvchi")
    first_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Ism")
    last_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Familiya")
    image = models.ImageField(
        upload_to='profile/',
        default="profile/user/user.png",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])],
        verbose_name="Profil rasmi"
    )
    # 
    bio = models.TextField(blank=True, null=True, verbose_name="Bio")
    age = models.IntegerField(default=12, validators=[MinValueValidator(12)], verbose_name="Yosh")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")
    skills =models.JSONField(default=list, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    stats = models.JSONField(default=dict, blank=True)  # {solved: 127, contests: 42, followers: 1200}
    
    def __str__(self):
        return f"{self.user.username} profile"
    
    @property
    def avatar_url(self):
        if self.image and hasattr(self.image, 'url'):
            return self.image.url
        return '/static/images/default_avatar.png'
    @property
    def is_premium(self):
        return self.user.is_superuser
    
    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profillar"
        ordering = ['-created_at']
