from rest_framework.routers import DefaultRouter
from .views import CurrencyViewSet, LanguageViewSet, LanguagePairViewSet

router = DefaultRouter()
router.register(r'currencies', CurrencyViewSet, basename='currencies')
router.register(r'languages', LanguageViewSet, basename='languages')
router.register(r'pairs', LanguagePairViewSet, basename='pairs')

urlpatterns = router.urls