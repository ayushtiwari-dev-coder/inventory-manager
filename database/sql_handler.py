import json
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

    @staticmethod
    def log_action(cursor, org_id, user_id, username, action_type, details):
        query = """
        INSERT INTO audit_logs (org_id, user_id, username, action_type, details)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (org_id, user_id, username, action_type, json.dumps(details)))

class User:
    @staticmethod
    def create_user(username, password_hash, name=None, gmail=None):
        query = """
        INSERT INTO users (username, password_hash, name, user_gmail)
        VALUES (%s, %s, %s, %s)
        """
        return DatabaseHelper.execute_query(query, (username, password_hash, name, gmail))
    
    @staticmethod
    def get_user_by_id(user_id):
        query = """
        SELECT user_id, username, name, lock_until
        FROM users
        WHERE user_id= %s AND is_active = 1
        """
        return DatabaseHelper.execute_query(query, (user_id,), fetch_type=2)

    @staticmethod
    def get_user(username):
        query = """
        SELECT user_id, username, password_hash, name, lock_until, failed_attempts
        FROM users
        WHERE username = %s AND is_active = 1
        """
        return DatabaseHelper.execute_query(query, (username,), fetch_type=2)

    @staticmethod
    def get_user_context(user_id, org_id=None):
        """
        Fetches user mapping info. If org_id is provided, it extracts their role 
        for that specific workspace. If org_id is None, it returns all active 
        organizations they belong to so the frontend can display a selection screen.
        """
        if org_id is not None:
            query = """
            SELECT u.user_id, u.username, u.name, u.is_active, uo.org_id, uo.role 
            FROM users u
            JOIN user_organizations uo ON u.user_id = uo.user_id
            WHERE u.user_id = %s AND uo.org_id = %s AND u.is_active = 1 AND uo.is_active = 1
            """
            return DatabaseHelper.execute_query(query, (user_id, org_id), fetch_type=2)
        else:
            query = """
            SELECT uo.org_id, o.org_name, uo.role 
            FROM user_organizations uo
            JOIN organizations o ON uo.org_id = o.org_id
            WHERE uo.user_id = %s AND uo.is_active = 1 AND o.is_active = 1
            """
            return DatabaseHelper.execute_query(query, (user_id,), fetch_type=1)

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
    def add_product(org_id, user_id, username, product_name, selling_price, stock, cost_price):
        if cost_price <= 0:
            return {"status": "error", "message": "Cost price must be greater than zero."}
        if selling_price <= 0 or stock < 0:
            return {"status": "error", "message": "Invalid product input parameters."}

        mrp = selling_price
        profit_margin = round(selling_price - cost_price, 2)
        
        db = get_connection()
        cursor = db.cursor()
        try:
            query = """
            INSERT INTO products (org_id, product_name, mrp, stock, profit_margin, cost_price)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (org_id, product_name, mrp, stock, profit_margin, cost_price))
            
            DatabaseHelper.log_action(cursor, org_id, user_id, username, "ADD_PRODUCT", {
                "product_name": product_name, 
                "stock": stock, 
                "selling_price": selling_price
            })
            
            db.commit()
            return {"status": "success"}
        except errors.IntegrityError as e:
            db.rollback()
            if "Duplicate" in str(e):
                return {"status": "duplicate_product","message":"the product already exists"}
            return {"status": "error", "message": str(e)}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()

    @staticmethod
    def get_all_products(org_id, low_stock_threshold=None, sort_by_stock=False):
        if low_stock_threshold is not None:
            query = """
            SELECT product_id, product_name, mrp, stock, profit_margin
            FROM products
            WHERE org_id = %s AND stock < %s AND is_active = 1
            ORDER BY stock ASC
            """
            params = (org_id, low_stock_threshold)
        
        elif sort_by_stock:
            query = """
            SELECT product_id, product_name, mrp, stock, profit_margin
            FROM products
            WHERE org_id = %s AND is_active = 1
            ORDER BY stock DESC
            """
            params = (org_id,)
        
        else:
            query = """
            SELECT product_id, product_name, mrp, stock, profit_margin
            FROM products
            WHERE org_id = %s AND is_active = 1
            ORDER BY product_name ASC
            """
            params = (org_id,)

        return DatabaseHelper.execute_query(query, params, fetch_type=1)

    @staticmethod
    def update_full_product(org_id, user_id, username, product_id, selling_price=None, cost_price=None, margin=None, stock_change=None):
        db=None
        cursor=None
        try:
            db=get_connection()
            cursor=db.cursor(dictionary=True)

            if selling_price=="":
                selling_price=None
            if cost_price=="":
                cost_price=None
            if stock_change=="":
                stock_change=None

            cursor.execute("""
            SELECT product_name, mrp, cost_price, stock
            FROM products
            WHERE org_id=%s AND product_id=%s AND is_active=1
            FOR UPDATE
            """,(org_id, product_id))

            product=cursor.fetchone()

            if not product:
                return {"status":"not_found"}
            
            new_sp = float(selling_price if selling_price is not None else product["mrp"])
            new_cp = float(cost_price if cost_price is not None else product["cost_price"])
            new_margin = round(new_sp - new_cp, 2)

            if stock_change is not None:
                if product["stock"] + stock_change < 0:
                    return {"status": "insufficient_stock","message":"warehouse does not have enough stocks"}
                
                if product["stock"] + stock_change > 2147483647:
                    return {"status": "error", "message": "Warehouse limit reached. Total stock cannot exceed 2,147,483,647."}
            stock_delta=int(stock_change) if stock_change is not None else 0

            cursor.execute("""
            UPDATE products
            SET mrp=%s, cost_price=%s, profit_margin=%s, stock=stock+%s
            WHERE org_id=%s AND product_id=%s
            """,(new_sp, new_cp, new_margin, stock_delta, org_id, product_id))

            DatabaseHelper.log_action(cursor, org_id, user_id, username, "UPDATE_PRODUCT", {
                "product_id": product_id,
                "product_name": product["product_name"],
                "stock_change": stock_delta,
                "new_selling_price": new_sp
            })

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
    def delete_product(org_id, user_id, username, product_id):
        db = get_connection()
        cursor = db.cursor()
        try:
            query = """
            UPDATE products
            SET is_active = 0, deleted_id = product_id, deleted_at = CURRENT_TIMESTAMP
            WHERE org_id = %s AND product_id = %s
            """
            cursor.execute(query, (org_id, product_id))
            
            DatabaseHelper.log_action(cursor, org_id, user_id, username, "DELETE_PRODUCT", {
                "product_id": product_id
            })
            
            db.commit()
            return {"status": "success"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()


class Sale:
    @staticmethod
    def record_sale(org_id, user_id, username, items):
        db = None
        cursor = None

        try:
            db = get_connection()
            cursor = db.cursor(dictionary=True)

            total_sale = 0
            total_profit = 0
            sale_items = []
            audit_item_details = []

            for item in items:
                product_id = item["product_id"]
                quantity = item["quantity"]

                if quantity <= 0:
                    return {"status": "error","message":"sale quantity must be greater than zero"}

                fetch_query = """
                SELECT product_id, product_name, mrp, stock, profit_margin
                FROM products
                WHERE org_id=%s AND product_id=%s AND is_active=1
                FOR UPDATE
                """
                cursor.execute(fetch_query, (org_id, product_id))
                product = cursor.fetchone()

                if not product:
                    return {"status": "error","message":"Product does not exist"}

                if product["stock"] < quantity:
                    return {"status": "error","message":f"insufficient stock.Only {product['stock']} units of {product['product_name']} left"}

                item_sale = product["mrp"] * quantity
                item_profit = product["profit_margin"] * quantity

                total_sale += item_sale
                total_profit += item_profit

                sale_items.append((product_id, quantity, item_profit, item_sale))
                audit_item_details.append({"product_id": product_id, "product_name": product["product_name"], "quantity": quantity})

                stock_query = """
                UPDATE products
                SET stock = stock - %s
                WHERE org_id=%s AND product_id=%s
                """
                cursor.execute(stock_query, (quantity, org_id, product_id))

            insert_sale = """
            INSERT INTO sales(org_id, user_id, total_profit, total_sale)
            VALUES(%s, %s, %s, %s)
            """
            cursor.execute(insert_sale, (org_id, user_id, total_profit, total_sale))
            sale_id = cursor.lastrowid

            insert_item = """
            INSERT INTO sale_items
            (sale_id, product_id, quantity, item_profit, item_sale)
            VALUES (%s,%s,%s,%s,%s)
            """
            for product_id, qty, profit, sale in sale_items:
                cursor.execute(insert_item, (sale_id, product_id, qty, profit, sale))

            DatabaseHelper.log_action(cursor, org_id, user_id, username, "RECORD_SALE", {
                "sale_id": sale_id,
                "items": audit_item_details,
                "total_sale": float(total_sale)
            })

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
    def get_recent_sales(org_id, limit=10):
        query = """
        SELECT 
            s.sale_time,
            p.product_name,
            si.quantity,
            si.item_sale,
            u.username as sold_by
        FROM sales s
        JOIN sale_items si ON s.sale_id = si.sale_id
        JOIN products p ON si.product_id = p.product_id
        JOIN users u ON s.user_id = u.user_id
        WHERE s.org_id=%s AND s.is_active=1
        ORDER BY s.sale_time DESC
        LIMIT %s
        """
        return DatabaseHelper.execute_query(query, (org_id, limit), fetch_type=1)

class Database:
    @staticmethod
    def create_tables():
        db = get_connection()
        cursor = db.cursor()

        user_table = """
        CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(50),
            user_gmail VARCHAR(100),
            phone_number VARCHAR(20),
            failed_attempts INT DEFAULT 0,
            lock_until INT DEFAULT 0,
            is_active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );
        """

        organization_table = """
        CREATE TABLE IF NOT EXISTS organizations (
            org_id INT AUTO_INCREMENT PRIMARY KEY,
            org_name VARCHAR(100) NOT NULL,
            owner_id INT NOT NULL,
            owner_gmail VARCHAR(100),
            manager_join_code VARCHAR(20) UNIQUE NOT NULL,
            employee_join_code VARCHAR(20) UNIQUE NOT NULL,
            is_active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            FOREIGN KEY(owner_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
        """

        user_org_table = """
        CREATE TABLE IF NOT EXISTS user_organizations (
            user_id INT NOT NULL,
            org_id INT NOT NULL,
            role ENUM('owner', 'manager', 'employee') NOT NULL,
            is_active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(user_id, org_id),
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY(org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
        );
        """

        product_table = """
        CREATE TABLE IF NOT EXISTS products (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            org_id INT NOT NULL,
            product_name VARCHAR(50) NOT NULL,
            mrp DECIMAL(15,2) NOT NULL,
            stock INT NOT NULL,
            profit_margin DECIMAL(15,2) NOT NULL,
            cost_price DECIMAL(15,2) NOT NULL,
            low_stock_threshold INT DEFAULT 40,
            is_active TINYINT DEFAULT 1,
            deleted_id INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            UNIQUE(org_id, product_name, deleted_id),
            FOREIGN KEY(org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
        );
        """

        sales_table = """
        CREATE TABLE IF NOT EXISTS sales (
            sale_id INT AUTO_INCREMENT PRIMARY KEY,
            org_id INT NOT NULL,
            user_id INT NOT NULL,
            total_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
            total_sale DECIMAL(15,2) NOT NULL,
            discount DECIMAL(15,2) DEFAULT 0,
            is_active TINYINT DEFAULT 1,
            sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
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
            FOREIGN KEY(sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
            FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
        );
        """

        permissions_table = """
        CREATE TABLE IF NOT EXISTS permissions (
            permission_id INT AUTO_INCREMENT PRIMARY KEY,
            permission_key VARCHAR(50) UNIQUE NOT NULL,
            description VARCHAR(255)
        );
        """

        org_role_permissions_table = """
        CREATE TABLE IF NOT EXISTS org_role_permissions (
            org_id INT NOT NULL,
            role ENUM('manager', 'employee') NOT NULL,
            permission_id INT NOT NULL,
            PRIMARY KEY(org_id, role, permission_id),
            FOREIGN KEY(org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
            FOREIGN KEY(permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
        );
        """

        audit_logs_table = """
        CREATE TABLE IF NOT EXISTS audit_logs (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            org_id INT NOT NULL,
            user_id INT NOT NULL,
            username VARCHAR(50) NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            details JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
        );
        """

        daily_summaries_table = """
        CREATE TABLE IF NOT EXISTS daily_summaries (
            summary_id INT AUTO_INCREMENT PRIMARY KEY,
            org_id INT NOT NULL,
            summary_date DATE NOT NULL,
            total_revenue DECIMAL(15,2) DEFAULT 0,
            total_profit DECIMAL(15,2) DEFAULT 0,
            UNIQUE(org_id, summary_date),
            FOREIGN KEY(org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
        );
        """

        cursor.execute(user_table)
        cursor.execute(organization_table)
        cursor.execute(user_org_table)
        cursor.execute(product_table)
        cursor.execute(sales_table)
        cursor.execute(sales_items_table)
        cursor.execute(permissions_table)
        cursor.execute(org_role_permissions_table)
        cursor.execute(audit_logs_table)
        cursor.execute(daily_summaries_table)

        db.commit()

        perms = [
            ('edit_inventory', 'Ability to add or update products'),
            ('delete_inventory', 'Ability to soft-delete products'),
            ('view_reports', 'Access to analytics dashboard'),
            ('view_audit_logs', 'Access to organization history')
        ]
        cursor.executemany("INSERT IGNORE INTO permissions (permission_key, description) VALUES (%s, %s)", perms)
        
        db.commit()
        cursor.close()
        db.close()