def valid_product_name(product_name):

    for ch in product_name:
        if not (ch.isalnum() or ch in (" ", "-")):
            return False

    return True