from database.sql_handler import Sale

from database.sql_handler import Sale

def record_sale(user_id, items):
    result = Sale.record_sale(user_id, items)
    

    if result.get("status") == "error":
        return result
        
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