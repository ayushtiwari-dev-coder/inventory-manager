from analytics.report import analytics


def stock_overview(user_id):
    return analytics.stock_overview(user_id)


def top_products(user_id):
    return analytics.top_products_by_profit_flow(user_id)


def lowest_selling_products(user_id):
    return analytics.low_selling_by_product_sold_flow(user_id)


def revenue_summary(user_id):
    return analytics.revenue_summary_flow(user_id)


def sales_trend(user_id):
    return analytics.sales_trend_flow(user_id)


# uvicorn main:app --host 0.0.0.0 --port 8000