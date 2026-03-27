from database.connection import get_connection
from mysql.connector import errors

def create_tables():
    db = get_connection()
    cursor = db.cursor()

    user_table = """
    CREATE TABLE IF NOT EXISTS users(
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    product_table = """
    CREATE TABLE IF NOT EXISTS products(
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_name VARCHAR(50) NOT NULL,
        mrp DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL,
        profit_margin DECIMAL(5,2) NOT NULL,
        UNIQUE(user_id, product_name),
        INDEX(user_id,product_id)
        FOREIGN KEY(user_id) REFERENCES users(user_id)
    );
    """

    sales_table = """
    CREATE TABLE IF NOT EXISTS sales(
        sale_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        total_sale DECIMAL(10,2) NOT NULL,
        sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        FOREIGN KEY(product_id) REFERENCES products(product_id),
        INDEX(product_id)
    );
    """

    cursor.execute(user_table)
    cursor.execute(product_table)
    cursor.execute(sales_table)

    db.commit()
    cursor.close()
    db.close()
def add_product(user_id, product_name, mrp, stock, profit_margin):

    if profit_margin >= mrp:
        return {"status": "invalid_margin"}

    if mrp <= 0:
        return {"status": "invalid_mrp"}

    if stock < 0:
        return {"status": "invalid_stock"}

    db=None
    cursor=None

    try:
        db=get_connection()
        cursor=db.cursor()

        query = """
        INSERT INTO products
        (user_id, product_name, mrp, stock, profit_margin)
        VALUES(%s,%s,%s,%s,%s)
        """

        cursor.execute(query,(user_id,product_name,mrp,stock,profit_margin))
        db.commit()

        return {"status":"success"}

    except errors.IntegrityError:
        return {"status":"duplicate_product"}

    finally:
        if cursor: cursor.close()
        if db: db.close()
def get_all_products(user_id):

    db=None
    cursor=None

    try:
        db=get_connection()
        cursor=db.cursor(dictionary=True)

        query="""
        SELECT product_id,product_name,mrp,stock,profit_margin
        FROM products
        WHERE user_id=%s
        ORDER BY product_name ASC
        """

        cursor.execute(query,(user_id,))
        return cursor.fetchall()

    finally:
        if cursor: cursor.close()
        if db: db.close()
def delete_product(user_id,product_id):

    db=None
    cursor=None

    try:
        db=get_connection()
        cursor=db.cursor()

        query="""
        DELETE FROM products
        WHERE user_id=%s AND product_id=%s
        """

        cursor.execute(query,(user_id,product_id))
        db.commit()

        if cursor.rowcount==0:
            return {"status":"not_found"}

        return {"status":"success"}

    finally:
        if cursor: cursor.close()
        if db: db.close()
def update_product_price(user_id,product_id,new_mrp):

    if new_mrp <= 0:
        return {"status":"invalid_mrp"}

    db=None
    cursor=None

    try:
        db=get_connection()
        cursor=db.cursor()

        query="""
        UPDATE products
        SET mrp=%s
        WHERE user_id=%s AND product_id=%s
        """

        cursor.execute(query,(new_mrp,user_id,product_id))
        db.commit()

        if cursor.rowcount==0:
            return {"status":"not_found"}

        return {"status":"success"}

    finally:
        if cursor: cursor.close()
        if db: db.close()
def update_profit_margin(user_id,product_id,new_margin):

    db=None
    cursor=None

    try:
        db=get_connection()
        cursor=db.cursor()

        query="""
        UPDATE products
        SET profit_margin=%s
        WHERE user_id=%s AND product_id=%s
        """

        cursor.execute(query,(new_margin,user_id,product_id))
        db.commit()

        if cursor.rowcount==0:
            return {"status":"not_found"}

        return {"status":"success"}

    finally:
        if cursor: cursor.close()
        if db: db.close()
def record_sale(user_id,product_id,quantity_sold):

    if quantity_sold <= 0:
        return {"status":"invalid_quantity"}

    db=None
    cursor=None

    try:
        db=get_connection()
        cursor=db.cursor(dictionary=True)

        fetch_query="""
        SELECT product_id,product_name,mrp,stock
        FROM products
        WHERE user_id=%s AND product_id=%s
        FOR UPDATE
        """

        cursor.execute(fetch_query,(user_id,product_id))
        product=cursor.fetchone()

        if not product:
            return {"status":"invalid_product"}

        if product["stock"] < quantity_sold:
            return {"status":"insufficient_stock"}

        total_sale = quantity_sold * product["mrp"]

        insert_query="""
        INSERT INTO sales(user_id,product_id,quantity,total_sale)
        VALUES(%s,%s,%s,%s)
        """

        cursor.execute(insert_query,(user_id,product_id,quantity_sold,total_sale))

        stock_query="""
        UPDATE products
        SET stock=stock-%s
        WHERE user_id=%s AND product_id=%s
        """

        cursor.execute(stock_query,(quantity_sold,user_id,product_id))

        db.commit()

        return {
            "status":"success",
            "product_name":product["product_name"],
            "quantity":quantity_sold,
            "total_sale":total_sale
        }

    finally:
        if cursor: cursor.close()
        if db: db.close()