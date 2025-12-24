from django.urls import path, include

urlpatterns = [
    path('api/core/', include('apps.core.urls')),
    path('api/translators/', include('apps.translators.urls')),
    path('api/stats/', include('apps.statistic.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/clients/', include('apps.clients.urls')),
    path('api/v1/', include('apps.users.urls')),

]