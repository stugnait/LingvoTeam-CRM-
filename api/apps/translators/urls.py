from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TranslatorViewSet, TranslatorTrafficViewSet

router = DefaultRouter()
router.register(r'translator-traffic', TranslatorTrafficViewSet, basename='traffic')

router.register(r'translators', TranslatorViewSet, basename='translators')

urlpatterns = [
    path('', include(router.urls)),
]