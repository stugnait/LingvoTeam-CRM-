from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Імпортуємо ваші ViewSets
from .views import ClientViewSet, ClientCategoryViewSet

router = DefaultRouter()

router.register(r'categories', ClientCategoryViewSet, basename='client-categories')

router.register(r'', ClientViewSet, basename='clients')

urlpatterns = [
    path('', include(router.urls)),
]