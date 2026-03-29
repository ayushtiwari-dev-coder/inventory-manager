from inventory.product_manager import product_manager
from inventory.sales_manager import sales_manager
from database.sql_handler import Database
from auth.session_manager import clear_session


def inventory_system(user_id):
    try:
        while True:

            print("\nINVENTORY MANAGER")
            print("1. Product Manager")
            print("2. Sales Manager")
            print("3. Exit")
            print("4.logout")

            choice = input("Enter your choice: ").strip()

            if choice == "1":
                product_manager(user_id)

            elif choice == "2":
                sales_manager(user_id)

            elif choice == "3":
                print("Exiting program...")
                exit()
            elif choice=="4":
                print("logging out")
                clear_session()
                break
            
            else:
                print("Invalid option")

    except Exception as e:
        print("\nSYSTEM ERROR OCCURRED")
        print("Please try again.")
        print(f"Error details: {e}")