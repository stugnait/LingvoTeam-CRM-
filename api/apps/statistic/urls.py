from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.statistic.views import OwnerDashboardViewSet, OwnerOrderDetailsViewSet

router = DefaultRouter()

router.register(r'order-details', OwnerOrderDetailsViewSet, basename='owner-order-details')

router.register(r'owner-dashboard', OwnerDashboardViewSet, basename='owner-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]