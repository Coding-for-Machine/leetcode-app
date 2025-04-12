from django.test import TestCase
from django.contrib.auth import get_user_model
from contest.models import UserContestStats, Contest
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError

class MyUserModelTest(TestCase):
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'testpassword123'
        }
        self.user = get_user_model().objects.create_user(**self.user_data)
    
    def test_create_user(self):
        user = self.user
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpassword123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, 'student')

    def test_create_superuser(self):
        superuser_data = {
            'email': 'admin@example.com',
            'username': 'adminuser',
            'password': 'adminpassword123'
        }
        superuser = get_user_model().objects.create_superuser(**superuser_data)
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertEqual(superuser.role, 'student')

    def test_user_profile(self):
        profile = self.user.profile
        profile.first_name = "Test"
        profile.save()

        self.assertEqual(profile.first_name, "Test")
        self.assertEqual(profile.avatar_url, '/media/profile/user/user.png')
        self.assertFalse(profile.is_premium)

    def test_email_required_for_user_creation(self):
        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(email='', password='password123')
    
    def test_unique_email_constraint(self):
        with self.assertRaises(IntegrityError):
            get_user_model().objects.create_user(email='test@example.com', password='anotherpassword123')

    def test_soft_delete(self):
        self.user.delete()
        self.assertTrue(self.user.is_deleted)
        self.assertFalse(self.user.is_active)

    def test_restore(self):
        self.user.delete()
        self.user.restore()
        self.assertFalse(self.user.is_deleted)
        self.assertTrue(self.user.is_active)
