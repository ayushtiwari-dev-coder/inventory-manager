from utils.validation import valid_product_name
from database.sql_handler import Product

def get_products(org_id, low_stock_threshold=None):
    products = Product.get_all_products(org_id, low_stock_threshold)
    if not products:
        return {"status": "no_products"}
    return {
        "status": "success",
        "products": products
    }

def add_product(org_id, user_id, username, product_name, selling_price, stock, cost_price):
    if not product_name:
        return {"status": "error", "message": "Product name cannot be empty."}
    if len(product_name) > 50:
        return {"status": "error", "message": "Product name cannot exceed 50 characters."}
    if not valid_product_name(product_name):
        return {"status": "error", "message": "Product name can only contain letters, numbers, and dashes."}
    
    # FIX: Selling price can be 0, but cannot be negative!
    if selling_price < 0:
        return {"status": "error", "message": "Selling price cannot be negative."}
    if selling_price > 99999999.99:
        return {"status": "error", "message": "Selling price value is too large."}
    
    # Cost price must remain strictly greater than 0
    if cost_price <= 0:
        return {"status": "error", "message": "Cost price must be greater than zero."}
    if cost_price > 99999999.99:
        return {"status": "error", "message": "Cost price value is too large."}
        
    if stock < 0:
        return {"status": "error", "message": "Initial stock cannot be negative."}

    result = Product.add_product(org_id, user_id, username, product_name.lower().strip(), selling_price, stock, cost_price)

    if result.get("status") == "duplicate_product":
        return {"status": "error", "message": "A product with this name already exists."}
    elif result.get("status") == "error":
        return {"status": "error", "message": result.get("message", "Failed to save product.")}
    return result

def update_product_full(org_id, user_id, username, product_id, selling_price=None, cost_price=None, stock_change=None):
    if selling_price is None and cost_price is None and stock_change is None:
        return {"status": "error", "message": "No update fields were provided."}

    if stock_change is not None:
        if not isinstance(stock_change, int):
            return {"status": "error", "message": "Stock change must be a valid whole number."}
        
        # FIX REMOVED: "if stock_change == 0:" -> Passing 0 is now explicitly valid!
        
        if stock_change > 9999999 or stock_change < -9999999:
            return {"status": "error", "message": "Stock change cannot exceed 9,999,999."}

    if selling_price is not None:
        # FIX: Changed from "<= 0" to "< 0" -> Selling price CAN now be 0!
        if selling_price < 0:
            return {"status": "error", "message": "Selling price cannot be negative."}
        if selling_price > 99999999.99:
            return {"status": "error", "message": "Selling price value is too large."}

    if cost_price is not None:
        # Cost price validation remains intact (must be > 0)
        if cost_price <= 0:
            return {"status": "error", "message": "Cost price must be greater than zero."}
        if cost_price > 99999999.99:
            return {"status": "error", "message": "Cost price value is too large."}

    margin = None
    result = Product.update_full_product(
        org_id, user_id, username, product_id, selling_price, cost_price, margin, stock_change
    )

    if result.get("status") == "insufficient_stock":
        return {"status": "error", "message": "Inventory update failed: Insufficient stock."}
    elif result.get("status") == "not_found":
        return {"status": "error", "message": "Product not found."}
    return result

def delete_product(org_id, user_id, username, product_id):
    return Product.delete_product(org_id, user_id, username, product_id)

def get_low_stock_products(org_id, threshold=40):
    low_stock = Product.get_all_products(org_id, low_stock_threshold=threshold)
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