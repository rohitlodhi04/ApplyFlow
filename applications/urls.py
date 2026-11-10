from django.urls import path
from .views import JobApplicationListCreateView, JobApplicationDetailView, RegisterView

urlpatterns = [
    path(
        'applications/',
        JobApplicationListCreateView.as_view(),
        name='application-list-create'
    ),
    path(
        'applications/<int:pk>/',
        JobApplicationDetailView.as_view(),
        name='application-detail'
    ),
    path('register/',
        RegisterView.as_view(),
        name='register'
    ),
]