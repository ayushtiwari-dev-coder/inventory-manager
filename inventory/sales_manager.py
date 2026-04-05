from database.sql_handler import Sale


def record_sale(user_id, product_id, quantity):

    if quantity <= 0:
        return {
            "status": "error",
            "message": "Quantity must be greater than zero"
        }

    result = Sale.record_sale(user_id, product_id, quantity)

    if result["status"] == "invalid_product":
        return {
            "status": "error",
            "message": "Product not found"
        }

    if result["status"] == "insufficient_stock":
        return {
            "status": "error",
            "message": "Not enough stock available"
        }

    if result["status"] == "invalid_quantity":
        return {
            "status": "error",
            "message": "Invalid quantity"
        }

    if result["status"] == "success":
        return {
            "status": "success",
            "data": {
                "product_name": result["product_name"],
                "quantity": result["quantity"],
                "total_sale": result["total_sale"]
            }
        }