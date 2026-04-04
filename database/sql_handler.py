from database.connection import get_connection
from mysql.connector import errors

class DatabaseHelper:
    @staticmethod
    def execute_query(query, params=None, fetch_type=None):
        db = get_connection()
        cursor = None

        try:
            cursor=db.cursor(dictionary=True)
            cursor.execute(query, params if params else ())
            if fetch_type==1:
                return cursor.fetchall() or []
            elif fetch_type==2:
                return cursor.fetchone() or {}
            else:
                db.commit()
                if cursor.rowcount==0:
                    return{"status":"not_found"}
                return {"status":"success"}
        except errors.IntegrityError as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            if cursor:cursor.close()
            if db: db.close()

class User:
    @staticmethod
    def create_user(username, password_hash):
        query = """
        INSERT INTO users (username, password_hash)
        VALUES (%s, %s)
        """
        return DatabaseHelper.execute_query(query, (username, password_hash))
    
    @staticmethod
    def get_user_by_id(user_id):
        query = """
        SELECT user_id, username, name, lock_until
        FROM users
        WHERE user_id= %s
        """
        return DatabaseHelper.execute_query(query, (user_id,), fetch_type=2)

    @staticmethod
    def get_user(username):
        query = """
        SELECT user_id, username, password_hash, name, lock_until
        FROM users
        WHERE username = %s
        """
        return DatabaseHelper.execute_query(query, (username,), fetch_type=2)

    @staticmethod
    def update_lock(username, lock_until):
        query = """
        UPDATE users
        SET lock_until = %s
        WHERE username = %s
        """
        return DatabaseHelper.execute_query(query, (lock_until, username))

    @staticmethod
    def update_name(username, name):
        query = """
        UPDATE users
        SET name = %s
        WHERE username = %s
        """
        return DatabaseHelper.execute_query(query, (name, username))

class Product:
    @staticmethod
    def add_product(user_id, product_name, mrp, stock, profit_margin):
        if profit_margin >= mrp:
            return {"status": "invalid_margin"}
        if mrp <= 0 or stock < 0:
            return {"status": "invalid_input"}

        query = """
        INSERT INTO products (user_id, product_name, mrp, stock, profit_margin)
        VALUES (%s, %s, %s, %s, %s)
        """
        result=DatabaseHelper.execute_query(query, (user_id, product_name, mrp, stock, profit_margin))
        if result.get("status")=="error":
            return {"status":"duplicate_product"}
        return result


    @staticmethod
    def get_all_products(user_id, low_stock_threshold=None, sort_by_stock=False):
        
        if low_stock_threshold is not None:
            query = """
            SELECT product_id, product_name, mrp, stock, profit_margin
            FROM products
            WHERE user_id = %s AND stock < %s
            ORDER BY stock ASC
            """
            params = (user_id, low_stock_threshold)
        
        elif sort_by_stock:
            query = """
            SELECT product_id, product_name, mrp, stock, profit_margin
            FROM products
            WHERE user_id = %s
            ORDER BY stock DESC
            """
            params = (user_id,)
        
        else:
            query = """
            SELECT product_id, product_name, mrp, stock, profit_margin
            FROM products
            WHERE user_id = %s
            ORDER BY product_name ASC
            """
            params = (user_id,)

        return DatabaseHelper.execute_query(query, params, fetch_type=1)

    @staticmethod
    def update_product_price(user_id, product_id, new_mrp):
        if new_mrp <= 0:
            return {"status": "invalid_mrp"}
        query = """
        UPDATE products
        SET mrp = %s
        WHERE user_id = %s AND product_id = %s
        """
        return DatabaseHelper.execute_query(query, (new_mrp, user_id, product_id))

    @staticmethod
    def update_profit_margin(user_id, product_id, new_margin):
        query = """
        UPDATE products
        SET profit_margin = %s
        WHERE user_id = %s AND product_id = %s
        """
        return DatabaseHelper.execute_query(query, (new_margin, user_id, product_id))

    @staticmethod
    def delete_product(user_id, product_id):
        query = """
        DELETE FROM products
        WHERE user_id = %s AND product_id = %s
        """
        return DatabaseHelper.execute_query(query, (user_id, product_id))
    @staticmethod
    def update_stock(user_id,product_id,change):
        if change==0:
            return{"status":"invalid_input"}

        db=None
        cursor=None
        
        query_fetch="""
        SELECT stock FROM products
        WHERE user_id=%s AND product_id=%s
        FOR UPDATE
        """
        try:
            db=get_connection()
            cursor=db.cursor(dictionary=True)
            cursor.execute(query_fetch,(user_id,product_id))
            product=cursor.fetchone()
            if not product:
                return {"status":"not_found"}
            if product["stock"]+change<0:
                return{"status":"insufficient_stock"}                                            

            query_update="""
            UPDATE products
            SET stock=stock+%s
            WHERE user_id=%s AND product_id=%s
            AND stock + %s>=0
            """
            cursor.execute(query_update, (change,user_id, product_id,change))
            db.commit()
            if cursor.rowcount==0:
                return{"status":"not_found"}
            return {"status":"success"}
        except Exception:
            if db:
                db.rollback()
            raise
        finally:
            if cursor: cursor.close()
            if db: db.close()


class Sale:
    @staticmethod
    def record_sale(user_id, product_id, quantity_sold):

        if quantity_sold <= 0:
            return {"status": "invalid_quantity"}

        db = None
        cursor = None

        try:
            db = get_connection()
            cursor = db.cursor(dictionary=True)

            fetch_query = """
            SELECT product_id, product_name, mrp, stock,profit_margin
            FROM products
            WHERE user_id = %s AND product_id = %s
            FOR UPDATE
            """

            cursor.execute(fetch_query, (user_id, product_id))
            product = cursor.fetchone()

            if not product:
                return {"status": "invalid_product"}

            if product["stock"] < quantity_sold:
                return {"status": "insufficient_stock"}

            total_sale = quantity_sold * product["mrp"]
            total_profit=product["profit_margin"]*quantity_sold

            insert_query = """
            INSERT INTO sales(user_id, product_id, quantity, total_sale,total_profit)
            VALUES(%s, %s, %s, %s, %s)
            """

            cursor.execute(insert_query, (user_id, product_id, quantity_sold, total_sale,total_profit))

            stock_query = """
            UPDATE products
            SET stock = stock - %s
            WHERE user_id = %s AND product_id = %s
            """

            cursor.execute(stock_query, (quantity_sold, user_id, product_id))

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
            if cursor: cursor.close()
            if db: db.close()



class Database:
    @staticmethod
    def create_tables():
        db = get_connection()
        cursor = db.cursor()
        user_table = """
        CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(50),
            lock_until INT DEFAULT 0,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        product_table = """
        CREATE TABLE IF NOT EXISTS products (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_name VARCHAR(50) NOT NULL,
            mrp DECIMAL(10,2) NOT NULL,
            stock INT NOT NULL,
            profit_margin DECIMAL(5,2) NOT NULL,
            UNIQUE(user_id, product_name),
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );
        """
        sales_table = """
        CREATE TABLE IF NOT EXISTS sales (
            sale_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            total_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
            total_sale DECIMAL(10,2) NOT NULL,
            sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id),
            FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
        );
        """
        cursor.execute(user_table)
        cursor.execute(product_table)
        cursor.execute(sales_table)
        db.commit()
        cursor.close()
        db.close()