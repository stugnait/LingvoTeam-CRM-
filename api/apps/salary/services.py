from decimal import Decimal
from django.db.models import Sum, Count, F, Q, ExpressionWrapper, DecimalField, Avg  # 🔥 Додали Avg
from django.db.models.functions import Cast, Coalesce
from apps.orders.models import Order


def calculate_stats(person, start, end, role_slug=None):
    # Визначаємо роль
    if not role_slug:
        if hasattr(person, 'role') and person.role:
            role_slug = person.role.slug
        else:
            role_slug = "translator"

    # 1. Базовий фільтр: беремо лише завершені замовлення за обраний період
    base_qs = Order.objects.filter(
        completed_at__isnull=False,
        completed_at__date__range=(start, end),
    )

    # 2. Фільтруємо за роллю
    # 2. Фільтруємо за роллю
    if role_slug == "editor":
        orders = base_qs.filter(editor_id=person.id)
    elif role_slug == "manager":
        orders = base_qs.filter(Q(manager_accept_id=person.id) | Q(manager_delivery_id=person.id))
    elif role_slug == "translator":
        orders = base_qs.filter(translator_id=person.id)
    elif role_slug in ["admin", "finance"]:
        orders = base_qs
    else:
        orders = Order.objects.none()

    # 3. Динамічна агрегація (рахуємо те, що треба всім)
    aggregation_args = {
        "total_revenue": Coalesce(Sum("total_amount"), Decimal("0.00")),
        "orders_count": Count("id", distinct=True),
        "overdue_orders": Count("id", filter=Q(completed_at__gt=F("deadline")), distinct=True),
    }

    # Якщо це НЕ менеджер, просимо БД порахувати сторінки та символи
    if role_slug != "manager":
        aggregation_args["total_pages"] = Coalesce(Sum("page_count"), 0.0)
        aggregation_args["total_symbols"] = Coalesce(Sum("symbols_count"), 0)
        aggregation_args["total_symbols_with_spaces"] = Coalesce(Sum("symbols_with_spaces_count"), 0)

    # 🔥 ДОДАНО: Якщо це перекладач, витягуємо середній бал за ці замовлення
    if role_slug == "translator":
        aggregation_args["avg_score"] = Avg("quality_score__score")

    stats = orders.aggregate(**aggregation_args)

    revenue = stats["total_revenue"]
    orders_count = stats["orders_count"]
    overdue_orders_count = stats["overdue_orders"]

    # Витягуємо значення безпечно
    pages_count = stats.get("total_pages", 0.0)
    symbols_count = stats.get("total_symbols", 0)
    chars_with_spaces_count = stats.get("total_symbols_with_spaces", 0)

    # 🔥 Дістаємо середній бал (якщо оцінок ще немає, Avg повертає None, тому ставимо 0.0)
    average_score = stats.get("avg_score") or 0.0

    margin = Decimal("0.00")

    # 4. Специфічний розрахунок Маржі для Менеджера
    if role_slug == "manager" and revenue > 0:
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
        "pages_count": round(pages_count, 2) if pages_count else 0.0,
        "chars_count": symbols_count,
        "chars_with_spaces_count": chars_with_spaces_count,
        "margin": round(margin, 2),
        "average_score": round(average_score, 2),  # 🔥 Додано у фінальний словник
    }