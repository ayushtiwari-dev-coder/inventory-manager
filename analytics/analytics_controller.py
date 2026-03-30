from analytics.report import analytics,analyticsFlow

def analytics_dashboard(user_id):
    while True:
        print("\nANALYTICS")
        print("1. Stock Overview")
        print("2.most selling products")
        print("3.lowest selling products")
        print("4. exit")

        choice = input("Enter your choice: ").strip()

        if choice == "1":
            analytics.stock_overview(user_id)

        elif choice=="2":
            analyticsFlow.top_products_by_profit_flow(user_id)

        elif choice == "3":
            analyticsFlow.low_selling_by_product_sold_flow(user_id)

        elif choice == "4":
            break
        else:
            print("Invalid option")