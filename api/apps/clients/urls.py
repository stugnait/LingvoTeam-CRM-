from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Імпортуємо ваші ViewSets
from .views import ClientDownloadView, ClientViewSet, ClientCategoryViewSet, ClientOrderAccessView

router = DefaultRouter()

router.register(r'categories', ClientCategoryViewSet, basename='client-categories')

router.register(r'', ClientViewSet, basename='clients')

urlpatterns = [
    
    path('<uuid:slug>/', ClientOrderAccessView.as_view(), name='external-order-access'),
    path('external/orders/<int:order_id>/download-files/', ClientDownloadView.as_view(), name='client-order-download'),
    path('external/orders/<int:order_id>/download-files/<str:folder>/', ClientDownloadView.as_view(), name='client-order-download-folder'),
    path('', include(router.urls)),
]