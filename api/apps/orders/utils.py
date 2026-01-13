from decimal import Decimal


class FinanceCalculator:

    @staticmethod
    def calculate_order_financials(order):
        client_revenue = Decimal(0)
        translator_payout = Decimal(0)

        if hasattr(order, 'traffic_id') and order.traffic_id:
            price = Decimal(getattr(order.traffic_id, 'price_per_page', 0) or 0)
            pages = Decimal(order.page_count or 0)
            client_revenue = pages * price

        if hasattr(order, 'translator_traffic_id') and order.translator_traffic_id:
            rate = Decimal(getattr(order.translator_traffic_id, 'rate_per_page', 0) or 0)
            pages = Decimal(order.page_count or 0)

            if 0 < rate < 1 and client_revenue > 0:
                translator_payout = client_revenue * rate
            else:
                translator_payout = pages * rate

        profit = client_revenue - translator_payout

        return {
            "revenue": client_revenue,
            "cost": translator_payout,
            "profit": profit
        }