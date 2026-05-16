from database.sql_handler import Sale

def record_sale(org_id, user_id, username, items):
    result = Sale.record_sale(org_id, user_id, username, items)
    
    if result.get("status") == "error":
        return result
        
    return {
        "status": "success",
        "data": {
            "total_sale": result["total_sale"],
            "total_profit": result["total_profit"]
        }
    }

def get_recent_sales(org_id):
    result = Sale.get_recent_sales(org_id)
    
    if not result:
        return {
            "status": "no_sales"
        }
        
    return {
        "status": "success",
        "sales": result
    }