from rest_framework import serializers
from apps.orders.models import Order
from apps.users.models import User
from apps.clients.models import Client
from apps.translators.models import Translator

# --- КРОК 1: Створюємо "шаблони" для вкладених даних ---

class ManagerInfoSerializer(serializers.ModelSerializer):
    """Витягує дані про менеджера з таблиці Users"""
    class Meta:
        model = User
        # Вкажіть тут поля, які хоче власник бачити про менеджера
        fields = ['id', 'full_name', 'email', 'phone', 'role']

class ClientInfoSerializer(serializers.ModelSerializer):
    """Витягує дані з таблиці Clients"""
    class Meta:
        model = Client
        fields = ['id', 'full_name', 'email', 'phone', 'category']

class TranslatorInfoSerializer(serializers.ModelSerializer):
    """Витягує дані з таблиці Translators"""
    class Meta:
        model = Translator
        fields = ['id', 'full_name', 'email', 'phone', 'work_type', 'currency']

# --- КРОК 2: Головний серіалізатор ---


class StatsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()

    total_orders = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    unpaid_orders_count = serializers.IntegerField()

class OwnerOrderListSerializer(serializers.ModelSerializer):
    # Тут ми кажемо: "Поле 'manager' — це не просто цифра, а цілий об'єкт ManagerInfoSerializer"
    manager = ManagerInfoSerializer(read_only=True)
    client = ClientInfoSerializer(read_only=True)
    translator = TranslatorInfoSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'created_at',
            'deadline',
            'page_count',
            'client_status',
            'status_id',
            'client_comment',
            # Важливо: імена цих полів мають співпадати зі змінними вище (manager, client, translator)
            'manager',
            'client',
            'translator'
        ]

