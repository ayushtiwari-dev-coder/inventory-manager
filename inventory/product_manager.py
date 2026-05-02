from utils.validation import valid_product_name
from database.sql_handler import Product




def get_products(user_id, low_stock_threshold=None):
    products = Product.get_all_products(user_id, low_stock_threshold)

    if not products:
        return {"status": "no_products"}

    return {
        "status": "success",
        "products": products
    }




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


# Update Stock

def update_product_full(user_id, product_id, mrp=None, margin=None, stock_change=None):
    if stock_change == 0:
        return {"status": "invalid_input"}
    if mrp <= 0:
        return {"status": "invalid_mrp"}

    if mrp > 99999999:
        return {"status": "value_too_large"}

    return Product.update_full_product(
        user_id,
        product_id,
        mrp,
        margin,
        stock_change
    )

# Delete Product


def delete_product(user_id, product_id):

    result = Product.delete_product(user_id, product_id)

    return result