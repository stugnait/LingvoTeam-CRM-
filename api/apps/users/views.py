from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .serializers import RegistrationSerializer
from drf_spectacular.utils import extend_schema


@extend_schema(tags=['Authentication'])
class RegistrationView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = (IsAdminUser,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        resp = Response({
            **serializer.data,
            'message': 'Реєстрація успішна.'
        }, status=status.HTTP_201_CREATED)
        return resp