from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('api/core/', include('apps.core.urls')),
    path('api/translators/', include('apps.translators.urls')),
    path('api/stats/', include('apps.statistic.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/clients/', include('apps.clients.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/notifications/', include('apps.notifications.urls')),

    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]