from database.sql_handler import Product,DatabaseHelper
class analytics:
    def stock_overview(user_id):
        products = Product.get_all_products(user_id, sort_by_stock=True)
        
        if not products:
            print("No products found.")
            return
        
        print("\nSTOCK OVERVIEW")
        print("-" * 50)
        print(f"{'Product':<20} {'Stock':>10} {'MRP':>10}")
        print("-" * 50)
        
        for p in products:
            print(f"{p['product_name']:<20} {p['stock']:>10} {p['mrp']:>10}")
        
        print("-" * 50)
    @staticmethod
    def top_products_by_profit(user_id,limit=10):
        query="""
        SELECT p.product_name,SUM(s.total_profit) AS total_profit
        from sales s
        JOIN products p ON s.product_id=p.product_id
        WHERE s.user_id=%s
        GROUP BY p.product_name
        ORDER BY total_profit DESC
        limit %s
        """
        return DatabaseHelper.execute_query(query,(user_id,limit),fetch_type=1)
class analyticsFlow:
    @staticmethod
    def top_products_by_profit(user_id):
        results = analytics.top_products_by_profit(user_id)
        
        if not results:
            print("No sales data found.")
            return
        
        print("\nTOP PRODUCTS BY PROFIT")
        print("-" * 45)
        print(f"{'Product':<25} {'Total Profit':>15}")
        print("-" * 45)
        
        for row in results:
            print(f"{row['product_name']:<25} {row['total_profit']:>15}")
        
        print("-" * 45)