from rest_framework.routers import DefaultRouter
from .views import CurrencyViewSet, LanguageViewSet, LanguagePairViewSet, TransactionViewSet, TransactionCategoryViewSet

router = DefaultRouter()
router.register(r'currencies', CurrencyViewSet, basename='currencies')
router.register(r'languages', LanguageViewSet, basename='languages')
router.register(r'pairs', LanguagePairViewSet, basename='pairs')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'transaction-categories', TransactionCategoryViewSet, basename='transaction-category')

urlpatterns = router.urls