from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TranslatorViewSet, TranslatorTrafficViewSet, ExternalOrderAccessView, TranslatorLanguagePairsViewSet

router = DefaultRouter()
router.register(r'translator-traffic', TranslatorTrafficViewSet, basename='traffic')

router.register(r'translator-pairs', TranslatorLanguagePairsViewSet, basename='translator-pairs')

router.register(r'', TranslatorViewSet, basename='translators')


urlpatterns = [
    path('<uuid:slug>/', ExternalOrderAccessView.as_view(), name='external-order-access'),

    path('', include(router.urls)),
]
