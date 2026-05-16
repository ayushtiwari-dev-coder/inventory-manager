from database.sql_handler import Product, DatabaseHelper

class analytics:
    @staticmethod
    def stock_overview(org_id):
        products = Product.get_all_products(org_id, sort_by_stock=True)
        
        if not products:
            return {
                "status": "error",
                "message": "No products found"
            }
        return {
            "status": "success",
            "data": products
        }

    @staticmethod
    def top_products_by_profit(org_id, limit=10):
        query = """
        SELECT
            p.product_name,
            SUM(si.item_profit) AS total_profit,
            SUM(si.quantity) AS total_quantity
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.sale_id
        JOIN products p ON si.product_id = p.product_id
        WHERE s.org_id=%s AND s.is_active=1 AND p.is_active=1
        GROUP BY p.product_id, p.product_name
        ORDER BY total_profit DESC
        LIMIT %s
        """
        results = DatabaseHelper.execute_query(
            query, (org_id, limit), fetch_type=1
        )
        return {
            "status": "success",
            "data": results
        }

    @staticmethod
    def least_sold_products(org_id, limit=10):
        query = """
        SELECT
            p.product_name,
            SUM(si.item_profit) AS total_profit,
            SUM(si.quantity) AS total_quantity
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.sale_id
        JOIN products p ON si.product_id = p.product_id
        WHERE s.org_id=%s AND s.is_active=1 AND p.is_active=1
        GROUP BY p.product_id, p.product_name
        ORDER BY total_quantity ASC
        LIMIT %s
        """
        results = DatabaseHelper.execute_query(
            query, (org_id, limit), fetch_type=1
        )
        return {
            "status": "success",
            "data": results
        }

    @staticmethod
    def revenue_summary(org_id, period=None):
        if period == "daily":
            date_filter = "AND DATE(sale_time)=CURDATE()"
        elif period == "monthly":
            date_filter = "AND MONTH(sale_time)=MONTH(CURDATE()) AND YEAR(sale_time)=YEAR(CURDATE())"
        elif period == "yearly":
            date_filter = "AND YEAR(sale_time)=YEAR(CURDATE())"
        elif period == "weekly":
            date_filter = "AND WEEK(sale_time)=WEEK(CURDATE()) AND YEAR(sale_time)=YEAR(CURDATE())"
        else:
            date_filter = ""

        query = f"""
        SELECT
            COUNT(sale_id) AS total_transactions,
            SUM(total_sale) AS total_revenue,
            SUM(total_profit) AS total_profit
        FROM sales
        WHERE org_id = %s AND is_active = 1
        {date_filter}
        """
        result = DatabaseHelper.execute_query(
            query, (org_id,), fetch_type=2
        )
        
        if not result or result.get("total_transactions") == 0:
            return {
                "status": "error",
                "message": "No sales data found"
            }
        return {
            "status": "success",
            "data": result
        }

    @staticmethod
    def sales_trend(org_id, months=4):
        query = """
        SELECT
            DATE(sale_time) AS sale_date,
            SUM(total_sale) AS revenue,
            SUM(total_profit) AS profit
        FROM sales
        WHERE org_id = %s AND is_active = 1
        AND sale_time>=DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        GROUP BY DATE(sale_time)
        ORDER BY sale_date DESC
        """
        results = DatabaseHelper.execute_query(
            query, (org_id, months), fetch_type=1
        )
        
        if not results:
            return {
                "status": "error",
                "message": "No sales data found"
            }

        # Format arrays for the React charts
        dates = [row["sale_date"] for row in results]
        revenue = [row["revenue"] for row in results]
        profit = [row["profit"] for row in results]

        return {
            "status": "success",
            "data": {
                "dates": dates,
                "revenue": revenue,
                "profit": profit
            }
        }