from database.sql_handler import Sale

def record_sale(user_id, items):

    result = Sale.record_sale(user_id, items)

    if result["status"] == "invalid_product":
        return {"status": "error", "message": "Product not found"}

    if result["status"] == "insufficient_stock":
        return {"status": "error", "message": "Not enough stock available"}

    if result["status"] == "invalid_quantity":
        return {"status": "error", "message": "Invalid quantity"}

    if result["status"] == "success":
        return {
            "status": "success",
            "data": {
                "total_sale": result["total_sale"],
                "total_profit": result["total_profit"]
            }
        }

def get_recent_sales(user_id):

    result = Sale.get_recent_sales(user_id)

    if not result:
        return {
            "status": "no_sales"
        }

    return {
        "status": "success",
        "sales": result
    }