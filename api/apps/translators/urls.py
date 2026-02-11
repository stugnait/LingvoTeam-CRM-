from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TranslatorUploadView, TranslatorViewSet, TranslatorTrafficViewSet, ExternalOrderAccessView, TranslatorLanguagePairsViewSet, ExternalTranslatorDownloadView

router = DefaultRouter()
router.register(r'translator-traffic', TranslatorTrafficViewSet, basename='traffic')

router.register(r'translator-pairs', TranslatorLanguagePairsViewSet, basename='translator-pairs')

router.register(r'', TranslatorViewSet, basename='translators')


urlpatterns = [
    path('<uuid:slug>/', ExternalOrderAccessView.as_view(), name='external-order-access'),
    path("translator-upload/", TranslatorUploadView.as_view()),

    path(
        'external/orders/<int:order_id>/download-files/',
        ExternalTranslatorDownloadView.as_view(),
        name='external-translator-download'
    ),
    path(
        'external/orders/<int:order_id>/download-files/<str:folder>/',
        ExternalTranslatorDownloadView.as_view(),
        name='external-translator-download-folder'
    ),

    path('', include(router.urls)),
]
