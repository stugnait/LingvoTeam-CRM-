from decimal import Decimal
from django.db.models import Sum, Count, F, Q, ExpressionWrapper, DecimalField
from django.db.models.functions import Cast, Coalesce
from apps.orders.models import Order

def calculate_stats(user, start, end):
    role_slug = user.role.slug if user.role else None

    # 1. Базовий фільтр: беремо лише завершені замовлення за обраний період
    base_qs = Order.objects.filter(
        completed_at__isnull=False,
        completed_at__date__range=(start, end),
    )

    # 2. Фільтруємо за роллю
    if role_slug == "editor":
        orders = base_qs.filter(editor_id=user)
    elif role_slug == "manager":
        # Використовуємо Q-об'єкти. Django сам зробить DISTINCT і не порахує
        # замовлення двічі, якщо менеджер і прийняв, і здав його.
        orders = base_qs.filter(Q(manager_accept_id=user) | Q(manager_delivery_id=user))
    elif role_slug == "translator":
        orders = base_qs.filter(translator_id=user)
    elif role_slug in ["admin", "finance"]:
        orders = base_qs
    else:
        orders = Order.objects.none()

    # 3. Загальна агрегація бази
    stats = orders.aggregate(
        total_revenue=Coalesce(Sum("total_amount"), Decimal("0.00")),
        orders_count=Count("id", distinct=True),
        # Якщо дата завершення більша за дедлайн — це протерміноване
        overdue_orders=Count("id", filter=Q(completed_at__gt=F("deadline")), distinct=True),
        total_pages=Coalesce(Sum("page_count"), 0.0),
        total_symbols=Coalesce(Sum("symbols_count"), 0),
    )

    revenue = stats["total_revenue"]
    orders_count = stats["orders_count"]
    overdue_orders_count = stats["overdue_orders"]
    pages_count = stats["total_pages"]
    symbols_count = stats["total_symbols"]
    margin = Decimal("0.00")

    # 4. 🔥 Специфічний розрахунок Маржі для Менеджера (взято з PnLViewSet)
    if role_slug == "manager" and revenue > 0:
        # Рахуємо витрати на перекладачів для цих замовлень
        orders_with_cost = orders.annotate(
            translator_cost_calc=ExpressionWrapper(
                Cast(F('page_count'), DecimalField(max_digits=12, decimal_places=2)) *
                Cast(F('translator_traffic_id__rate_per_page'), DecimalField(max_digits=12, decimal_places=2)),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )
        cogs = orders_with_cost.aggregate(
            total_cogs=Coalesce(Sum('translator_cost_calc'), Decimal('0.00'))
        )['total_cogs']

        gross_profit = revenue - cogs
        margin = (gross_profit / revenue) * Decimal('100.0')

    return {
        "revenue": round(revenue, 2),
        "orders_count": orders_count,
        "overdue_orders_count": overdue_orders_count,
        "pages_count": round(pages_count, 2),
        "symbols_count": symbols_count,
        "margin": round(margin, 2),
    }