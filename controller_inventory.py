from database.sql_handler import Product


def get_low_stock_products(user_id, threshold=40):
    low_stock = Product.get_all_products(user_id, low_stock_threshold=threshold)

    if not low_stock:
        return {
            "status": "success",
            "data": [],
            "message": "No low stock products"
        }

    return {
        "status": "success",
        "data": low_stock
    }