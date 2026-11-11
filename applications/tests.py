from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import JobApplication

User = get_user_model()


class ApplicationOwnershipTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1', password='TestPass@123'
        )
        self.user2 = User.objects.create_user(
            username='user2', password='TestPass@123'
        )
        JobApplication.objects.create(
            owner=self.user1,
            company_name='Google',
            job_role='SDE Intern',
        )

    def test_list_requires_authentication(self):
        response = self.client.get('/api/applications/')
        self.assertEqual(response.status_code, 401)

    def test_user_sees_only_own_applications(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/applications/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)