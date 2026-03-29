from inventory.product_manager import product_manager
from inventory.sales_manager import sales_manager
from database.sql_handler import Database,Product
from auth.session_manager import clear_session
from analytics.analytics_controller import analytics_dashboard


def inventory_system(user_id):
    show_low_stock_alert(user_id,threshold=40)
    try:
        while True:

            print("\nINVENTORY MANAGER")
            print("1. Product Manager")
            print("2. Sales Manager")
            print("3.Analytics")
            print("4. Exit")
            print("5.logout")

            choice = input("Enter your choice: ").strip()

            if choice == "1":
                product_manager(user_id)

            elif choice == "2":
                sales_manager(user_id)

            elif choice == "3":
                analytics_dashboard(user_id)

            elif choice=="4":
                print("come back soon")
                exit()

            elif choice=="5":
                print("logging out")
                clear_session()
                break
            
            else:
                print("Invalid option")

    except Exception as e:
        print("\nSYSTEM ERROR OCCURRED")
        print("Please try again.")
        print(f"Error details: {e}")

def show_low_stock_alert(user_id, threshold=40):
    low_stock = Product.get_all_products(user_id, low_stock_threshold=threshold)
    if low_stock:
        print("\n⚠ LOW STOCK ALERT")
        print("-" * 40)
        for product in low_stock:
            print(f"{product['product_name']} — {product['stock']} units remaining")
        print("-" * 40)

