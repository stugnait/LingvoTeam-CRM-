from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.statistic.views import OwnerDashboardViewSet, OwnerOrderDetailsViewSet

router = DefaultRouter()

router.register(r'dashboard', OwnerDashboardViewSet, basename='owner-dashboard')
router.register(r'details', OwnerOrderDetailsViewSet, basename='owner-details')

urlpatterns = [
    path('', include(router.urls)),
]