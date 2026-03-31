from database.sql_handler import Product,DatabaseHelper
from analytics.graph import graph
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
        SELECT p.product_name,SUM(s.total_profit) AS total_profit,SUM(s.quantity) AS total_quantity
        from sales s
        JOIN products p ON s.product_id=p.product_id
        WHERE s.user_id=%s
        GROUP BY p.product_name
        ORDER BY total_profit DESC
        limit %s
        """
        return DatabaseHelper.execute_query(query,(user_id,limit),fetch_type=1)

    @staticmethod
    def least_sold_products(user_id,limit=10):
        query="""
        SELECT p.product_name,SUM(s.total_profit) AS total_profit,SUM(s.quantity) AS total_quantity
        from sales s
        JOIN products p ON s.product_id=p.product_id
        WHERE s.user_id=%s
        GROUP BY p.product_name
        ORDER BY total_quantity ASC
        limit %s
        """
        return DatabaseHelper.execute_query(query,(user_id,limit),fetch_type=1)

    @staticmethod
    def revenue_summary(user_id,period=None):
        if period=="daily":
            date_filter="AND DATE(sale_time)=CURDATE()"
        elif period=="monthly":
            date_filter="AND MONTH(sale_time)=MONTH(CURDATE()) AND YEAR(sale_time)=YEAR(CURDATE())"
        elif period=="yearly":
            date_filter="AND YEAR(sale_time)=YEAR(CURDATE())"
        elif period=="weekly":
            date_filter="AND WEEK(sale_time)=WEEK(CURDATE()) AND YEAR(sale_time)=YEAR(CURDATE())"
        else:
            date_filter=""

        query=f"""
        SELECT
        COUNT(sale_id) AS total_transactions,
        SUM(total_sale) AS total_revenue,
        SUM(total_profit) AS total_profit
        FROM sales
        WHERE user_id=%s
        {date_filter}
        """        
        return DatabaseHelper.execute_query(query,(user_id,),fetch_type=2)
    
    def sales_trend(user_id,months=4):
        query="""
        SELECT
        DATE(sale_time) AS sale_date,
        SUM(total_sale) AS revenue,
        SUM(total_profit) AS profit
        FROM sales
        WHERE user_id=%s
        AND sale_time>=DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        GROUP BY DATE(sale_time)
        ORDER BY sale_date DESC
        """
        return DatabaseHelper.execute_query(query,(user_id,months),fetch_type=1)





class analyticsFlow:
    @staticmethod
    def top_products_by_profit_flow(user_id):
        results = analytics.top_products_by_profit(user_id)
        
        if not results:
            print("No sales data found.")
            return
        
        print("\nTOP PRODUCTS BY PROFIT")
        print("-" * 50)
        print(f"{'Product':<25} {'qty sold':>10} {'Total Profit':>15}")
        print("-" * 50)
        
        for row in results:
            print(f"{row['product_name']:<20} {row['total_quantity']:>10} {row['total_profit']:>15}")
        
        print("-" * 45)

    @staticmethod
    def low_selling_by_product_sold_flow(user_id):
        results = analytics.least_sold_products(user_id)
        
        if not results:
            print("No sales data found.")
            return
        
        print("\nTOP PRODUCTS BY PROFIT")
        print("-" * 50)
        print(f"{'Product':<25} {'qty sold':>10} {'Total Profit':>15}")
        print("-" * 50)
        
        for row in results:
            print(f"{row['product_name']:<20} {row['total_quantity']:>10} {row['total_profit']:>15}")
        
        print("-" * 45)

    @staticmethod
    def revenue_summary_flow(user_id):
        print("\n1. Daily")
        print("2. Monthly")
        print("3. Yearly")
        print("4.Weekly")
        
        choice = input("Select period: ").strip()
        
        if choice == "1":
            period = "daily"
        elif choice == "2":
            period = "monthly"
        elif choice == "3":
            period = "yearly"
        elif choice=="4":
            period="weekly"
        else:
            print("Invalid option")
            return
        
        result = analytics.revenue_summary(user_id, period)
        
        if not result or result.get("total_transactions") == 0:
            print("No sales data found for this period.")
            return
        
        print(f"\n{period.upper()} SUMMARY")
        print("-" * 40)
        print(f"Total Transactions : {result['total_transactions']}")
        print(f"Total Revenue      : {result['total_revenue']}")
        print(f"Total Profit       : {result['total_profit']}")
        print("-" * 40)

    @staticmethod
    def sales_trend_flow(user_id):
        while True:
            print("\n1. last 4 months")
            print("2. last 8 months")
            print("3. last 1 year")
            print("4. last 2 year")
            
            
            choice = input("Select period or ('type exit'): ").strip()

            if choice=="exit":
                break
            if choice == "1":
                months=4
            elif choice == "2":
                months=8
            elif choice == "3":
                months=12
            elif choice=="4":
                months=24
            else:
                print("Invalid option")
                break
            results=analytics.sales_trend(user_id,months)
            if not results:
                print("no sales data found ")
                return

            dates=[row["sale_date"] for row in results]
            revenue=[row["revenue"] for row in results]
            profit=[row["profit"] for row in results]

            print("\n1.REVENUE GRAPH")
            print("2.PROFIT GRAPH")

            graph_choice=input("enter your choice or (type exit): ")

            if graph_choice=="exit":
                return
            if graph_choice=="1":
                graph.revenue_graph(dates,revenue,months)
                
            elif graph_choice=="2":
                graph.profit_graph(dates,profit,months)
            else:
                print("invalid input")
                continue
