from utils.validation import valid_product_name
from database.sql_handler import Product


# -------------------------
# View Products
# -------------------------

def get_products(user_id, low_stock_threshold=None):
    products = Product.get_all_products(user_id, low_stock_threshold)

    if not products:
        return {"status": "no_products"}

    return {
        "status": "success",
        "products": products
    }


# -------------------------
# Add Product
# -------------------------

def add_product(user_id, product_name, mrp, stock, profit_margin):

    if not product_name:
        return {"status": "invalid_name"}

    if len(product_name) > 50:
        return {"status": "name_too_long"}

    if not valid_product_name(product_name):
        return {"status": "invalid_characters"}

    if mrp <= 0:
        return {"status": "invalid_mrp"}

    if mrp > 99999999.99:
        return {"status": "mrp_too_large"}

    if profit_margin >= mrp:
        return {"status": "invalid_margin"}

    if stock < 0:
        return {"status": "invalid_stock"}

    result = Product.add_product(user_id, product_name.lower(), mrp, stock, profit_margin)

    return result


# -------------------------
# Update Product Price
# -------------------------

def update_product_price(user_id, product_id, new_mrp):

    if new_mrp <= 0:
        return {"status": "invalid_mrp"}

    if new_mrp > 99999999:
        return {"status": "value_too_large"}

    return Product.update_product_price(user_id, product_id, new_mrp)


# -------------------------
# Update Profit Margin
# -------------------------

def update_profit_margin(user_id, product_id, new_margin):

    products = Product.get_all_products(user_id)

    selected_product = None

    for p in products:
        if p["product_id"] == product_id:
            selected_product = p
            break

    if not selected_product:
        return {"status": "not_found"}

    mrp = selected_product["mrp"]

    if new_margin >= mrp:
        return {"status": "invalid_margin"}

    return Product.update_profit_margin(user_id, product_id, new_margin)


# -------------------------
# Update Stock
# -------------------------

def update_stock(user_id, product_id, change):

    if change == 0:
        return {"status": "invalid_input"}

    return Product.update_stock(user_id, product_id, change)


# -------------------------
# Delete Product
# -------------------------

def delete_product(user_id, product_id):

    result = Product.delete_product(user_id, product_id)

    return result