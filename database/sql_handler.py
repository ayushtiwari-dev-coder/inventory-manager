from database.connection import get_connection
from mysql.connector import errors  


def create_tables():
    db=get_connection()
    cursor=db.cursor()

    product_table_query="""
    CREATE TABLE IF NOT EXISTS products(
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(50) UNIQUE NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    profit_margin DECIMAL(5,2) NOT NULL 
    )
    """
    sales_table_query="""
    CREATE TABLE IF NOT EXISTS sales(
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    total_sale DECIMAL(10,2) NOT NULL,
    sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX(product_id)
    )
    """
    cursor.execute(product_table_query)
    cursor.execute(sales_table_query)

    db.commit()
    cursor.close()
    db.close()

def add_product(product_name,mrp,stock,profit_margin):
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

        query="""
    INSERT INTO products
    (product_name,mrp,stock,profit_margin)
    VALUES(%s,%s,%s,%s)
        """
        cursor.execute(query,(product_name,mrp,stock,profit_margin))
        db.commit()

        
        return {"status":"success"}
    except errors.IntegrityError:
        return {"status":"duplicate_product"}
    except Exception:
        raise

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


def get_all_products():
    db=None
    cursor=None
    try:
        db=get_connection()
        cursor=db.cursor(dictionary=True)
        query="""
        SELECT product_id,product_name,mrp,stock,profit_margin
        FROM products
        ORDER BY product_name ASC
        """
        cursor.execute(query)
        products=cursor.fetchall()

        
        return products
    except Exception:
        raise
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()
def delete_product(product_id):

    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor()

        query = """
        DELETE FROM products
        WHERE product_id = %s
        """

        cursor.execute(query, (product_id,))
        db.commit()
        
        if cursor.rowcount==0:
            return {"status":"not_found"}
        return {"status":"success"}

    except Exception:
        raise

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()
def update_product_price(product_id, new_mrp):
    if new_mrp <= 0:
        return {"status":"invalid_mrp"}


    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor()

        query = """
        UPDATE products
        SET mrp = %s
        WHERE product_id = %s
        """

        cursor.execute(query, (new_mrp, product_id))
        db.commit()
        if cursor.rowcount==0:
            return{"status":"not_found"}
        return{"status":"success"}

    except Exception:
        raise

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()
def update_profit_margin(product_id, new_margin):
    
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor()

        query = """
        UPDATE products
        SET profit_margin = %s
        WHERE product_id = %s
        """

        cursor.execute(query, (new_margin, product_id))
        db.commit()
        if cursor.rowcount==0:
            return{"status":"not_found"}
        return{"status":"success"}

    except Exception:
        raise

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()
def record_sale(product_id,quantity_sold):
    if quantity_sold<=0:
        return{"status":"invalid_quantity"}
    db=None
    cursor=None
    try:
        db=get_connection()
        cursor=db.cursor(dictionary=True)

        fetch_query="""
        SELECT product_id,product_name,mrp,stock
        FROM products
        WHERE product_id=%s
        FOR UPDATE
        """
        cursor.execute(fetch_query,(product_id,))
        product=cursor.fetchone()

        if not product:
            return {"status": "invalid_product"}

        if product["stock"]<quantity_sold:
            return {"status": "insufficient_stock"}

        total_sale=quantity_sold*product["mrp"]

        insert_query="""
        INSERT INTO sales(product_id,quantity,total_sale)
        VALUES(%s,%s,%s)
        """
        cursor.execute(insert_query,(product_id,quantity_sold,total_sale))

        stock_query="""
        UPDATE products
        SET stock=stock-%s
        WHERE product_id=%s
        """
        cursor.execute(stock_query,(quantity_sold,product_id))

        db.commit()
        return {
        "status": "success",
        "product_name": product["product_name"],
        "quantity": quantity_sold,
        "total_sale": total_sale
        }

    except Exception:
        if db:
            db.rollback()
        raise

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()