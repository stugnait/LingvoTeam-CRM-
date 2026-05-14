from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Notification
from .serializers import NotificationSerializer

@extend_schema_view(
    list=extend_schema(
        summary="Всі сповіщення користувача",
        description="Повертає історію всіх сповіщень поточного користувача."
    )
)
class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @extend_schema(
        summary="Список непрочитаних сповіщень",
        description="Повертає тільки ті сповіщення, які ще не були прочитані.",
        responses={200: NotificationSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def unread(self, request):
        queryset = self.get_queryset().filter(is_read=False)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "results": serializer.data
        })

    @extend_schema(
        summary="Прочитати всі сповіщення",
        description="Позначає всі непрочитані сповіщення користувача як прочитані.",
        request=None,
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}}
    )
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"status": "ok"})

    @extend_schema(
        summary="Прочитати конкретне сповіщення",
        description="Позначає одне сповіщення як прочитане за його ID.",
        request=None,
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}}
    )
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "marked as read"})