from decimal import Decimal
from django.db.models import Sum, Count, F, Q
from apps.orders.models import Order


def calculate_stats(user, start, end):
    role_slug = user.role.slug if user.role else None

    orders = Order.objects.none()

    if role_slug == "editor":
        orders = Order.objects.filter(
            editor_id=user,
            completed_at__isnull=False,
            completed_at__date__range=(start, end),
        )

    elif role_slug == "manager":
        orders = Order.objects.filter(
            manager_id=user,
            completed_at__isnull=False,
            completed_at__date__range=(start, end),
        )

    elif role_slug == "translator":
        orders = Order.objects.filter(
            translator_id=user,
            completed_at__isnull=False,
            completed_at__date__range=(start, end),
        )

    elif role_slug == "admin":
        orders = Order.objects.filter(
            completed_at__isnull=False,
            completed_at__date__range=(start, end),
        )

    elif role_slug == "finance":
        orders = Order.objects.filter(
            completed_at__isnull=False,
            completed_at__date__range=(start, end),
        )

    stats = orders.aggregate(
        revenue=Sum("total_amount"),
        orders_count=Count("id"),
        overdue_orders=Count(
            "id",
            filter=Q(completed_at__gt=F("deadline"))
        ),
    )

    return {
        "revenue": stats["revenue"] or Decimal("0"),
        "orders_count": stats["orders_count"] or 0,
        "overdue_orders_count": stats["overdue_orders"] or 0,
        "margin": Decimal("0"),
    }