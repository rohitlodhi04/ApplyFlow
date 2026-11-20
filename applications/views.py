from rest_framework import generics , filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import JobApplication
from .serializers import JobApplicationSerializer, RegisterSerializer


class JobApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['company_name', 'job_role']

    def get_queryset(self):
        queryset = JobApplication.objects.filter(owner=self.request.user)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status.upper())
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class JobApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(owner=self.request.user)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ApplicationStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = JobApplication.objects.filter(owner=request.user)
        counts = queryset.values('status').annotate(total=Count('id'))
        by_status = {item['status']: item['total'] for item in counts}
        return Response({
            'total': queryset.count(),
            'by_status': by_status,
        })