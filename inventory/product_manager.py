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




def add_product(user_id, product_name, selling_price, stock, cost_price):

    if not product_name:
        return {"status": "invalid_name"}

    if len(product_name) > 50:
        return {"status": "name_too_long"}

    if not valid_product_name(product_name):
        return {"status": "invalid_characters"}

    if  selling_price<= 0:
        return {"status": "invalid_selling_price"}
    
    if cost_price>99999999.99:
        return {"status":"cost_price_to_high"}

    if selling_price > 99999999.99 :
        return {"status": "selling_price_too_high"}

    if  cost_price<=0:
        return {"status": "invalid_cost_price"}

    if stock < 0:
        return {"status": "invalid_stock"}
    

    result = Product.add_product(user_id, product_name.lower().strip(), selling_price, stock,cost_price)

    return result


# Update Stock

def update_product_full(user_id, product_id, selling_price=None, cost_price=None, stock_change=None):

    if selling_price is None and cost_price is None and stock_change is None:
        return{"status":"no_update_fields"}
    
    if stock_change is not None:
        if not isinstance(stock_change,int):
            return{"status":"invalid_stock"}
    
    if stock_change == 0:
        return {"status": "invalid_input"}
    if selling_price is not None and selling_price <= 0:
        return {"status": "selling_price_to_low"}

    if selling_price is not None and selling_price > 99999999.99:
        return {"status": "selling_price_to_high"}
    
    if cost_price is not None and cost_price <= 0:
        return {"status": "cost_price_to_low"}

    if cost_price is not None and cost_price > 99999999.99:
        return {"status": "cost_price_to_high"}
    
    margin=None

    return Product.update_full_product(
        user_id,
        product_id,
        selling_price,
        cost_price,
        margin,
        stock_change
    )

# Delete Product


def delete_product(user_id, product_id):

    result = Product.delete_product(user_id, product_id)

    return result