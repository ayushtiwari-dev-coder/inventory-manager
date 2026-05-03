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
        except Exception as e:
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
        SELECT user_id, username, password_hash, name, lock_until,failed_attempts
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
    
    @staticmethod
    def update_failed_attempts(username, attempts):
        query = """
        UPDATE users
        SET failed_attempts = %s
        WHERE username = %s
        """
        return DatabaseHelper.execute_query(query, (attempts, username))

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
    def update_full_product(user_id, product_id, mrp=None, margin=None, stock_change=None):

        db=None
        cursor=None

        try:
            
            db=get_connection()
            cursor=db.cursor(dictionary=True)

            cursor.execute("""
            SELECT mrp, profit_margin, stock
            FROM products
            WHERE user_id=%s AND product_id=%s
            FOR UPDATE
            """,(user_id,product_id))

            product=cursor.fetchone()

            if not product:
                return {"status":"not_found"}
            

            new_mrp = float(mrp if mrp is not None else product["mrp"])
            new_margin = float(margin if margin is not None else product["profit_margin"])

            

            if new_margin >= new_mrp:
                return {"status":"invalid_margin"}

            if stock_change is not None:
                if product["stock"] + stock_change < 0:
                    return {"status":"insufficient_stock"}

            cursor.execute("""
            UPDATE products
            SET mrp=%s,
                profit_margin=%s,
                stock=stock+%s
            WHERE user_id=%s AND product_id=%s
            """,(new_mrp,new_margin,stock_change or 0,user_id,product_id))

            db.commit()

            return {"status":"success"}

        except Exception as e:
            if db:
                db.rollback()
            return {"status":"error","message":str(e)}

        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()



    @staticmethod
    def delete_product(user_id, product_id):
        query = """
        DELETE FROM products
        WHERE user_id = %s AND product_id = %s
        """
        return DatabaseHelper.execute_query(query, (user_id, product_id))


class Sale:
    @staticmethod
    def record_sale(user_id, items):

        db = None
        cursor = None

        try:

            db = get_connection()
            cursor = db.cursor(dictionary=True)

            total_sale = 0
            total_profit = 0

            sale_items = []

            for item in items:

                product_id = item["product_id"]
                quantity = item["quantity"]

                if quantity <= 0:
                    return {"status": "invalid_quantity"}

                fetch_query = """
                SELECT product_id, product_name, mrp, stock, profit_margin
                FROM products
                WHERE user_id=%s AND product_id=%s
                FOR UPDATE
                """

                cursor.execute(fetch_query, (user_id, product_id))
                product = cursor.fetchone()

                if not product:
                    return {"status": "invalid_product"}

                if product["stock"] < quantity:
                    return {"status": "insufficient_stock"}

                item_sale = product["mrp"] * quantity
                item_profit = product["profit_margin"] * quantity

                total_sale += item_sale
                total_profit += item_profit

                sale_items.append(
                    (product_id, quantity, item_profit, item_sale)
                )

                stock_query = """
                UPDATE products
                SET stock = stock - %s
                WHERE user_id=%s AND product_id=%s
                """

                cursor.execute(stock_query, (quantity, user_id, product_id))

            insert_sale = """
            INSERT INTO sales(user_id, total_profit, total_sale)
            VALUES(%s, %s, %s)
            """

            cursor.execute(insert_sale, (user_id, total_profit, total_sale))

            sale_id = cursor.lastrowid

            insert_item = """
            INSERT INTO sale_items
            (sale_id, product_id, quantity, item_profit, item_sale)
            VALUES (%s,%s,%s,%s,%s)
            """

            for product_id, qty, profit, sale in sale_items:

                cursor.execute(
                    insert_item,
                    (sale_id, product_id, qty, profit, sale)
                )

            db.commit()

            return {
                "status": "success",
                "total_sale": total_sale,
                "total_profit": total_profit
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


    @staticmethod
    def get_recent_sales(user_id, limit=10):

        query = """
        SELECT 
            s.sale_time,
            p.product_name,
            si.quantity,
            si.item_sale
        FROM sales s
        JOIN sale_items si ON s.sale_id = si.sale_id
        JOIN products p ON si.product_id = p.product_id
        WHERE s.user_id=%s
        ORDER BY s.sale_time DESC
        LIMIT %s
        """

        return DatabaseHelper.execute_query(
            query, (user_id, limit), fetch_type=1
        )



class Database:
    @staticmethod
    def create_tables():
        db = get_connection()
        cursor = db.cursor()
        user_table = """
        CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            failed_attempts INT DEFAULT 0,
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
            mrp DECIMAL(15,2) NOT NULL,
            stock INT NOT NULL,
            profit_margin DECIMAL(15,2) NOT NULL,

            UNIQUE(user_id, product_name),

            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
        """

        sales_table = """
        CREATE TABLE IF NOT EXISTS sales (
            sale_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
            total_sale DECIMAL(15,2) NOT NULL,
            sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,

            INDEX idx_sales_user (user_id),
            INDEX idx_sales_time (sale_time)
        );
        """

        sales_items_table = """
        CREATE TABLE IF NOT EXISTS sale_items (
            item_id INT AUTO_INCREMENT PRIMARY KEY,
            sale_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            item_profit DECIMAL(15,2) NOT NULL,
            item_sale DECIMAL(15,2) NOT NULL,

            FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,

            INDEX idx_sale_items_sale (sale_id),
            INDEX idx_sale_items_product (product_id)
        );
        """
        cursor.execute(user_table)
        cursor.execute(product_table)
        cursor.execute(sales_table)
        cursor.execute(sales_items_table)
        db.commit()
        cursor.close()
        db.close()