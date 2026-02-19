from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, OrderTrafficViewSet

router = DefaultRouter()

router.register(r'order-traffic', OrderTrafficViewSet, basename='order-traffic')

router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
]