from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, OrderTrafficViewSet, AnalyzeFileUploadView

router = DefaultRouter()

router.register(r'order-traffic', OrderTrafficViewSet, basename='order-traffic')

router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),

    path('orders/analyze-file/', AnalyzeFileUploadView.as_view(), name='analyze-file'),
]