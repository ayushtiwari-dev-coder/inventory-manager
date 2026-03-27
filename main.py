from inventory.product_manager import product_manager
from inventory.sales_manager import sales_manager
from database.sql_handler import create_tables

try:
    create_tables()

    while True:

        print("\nINVENTORY MANAGER")
        print("1. Product Manager")
        print("2. Sales Manager")
        print("3. Exit")

        choice = input("Enter your choice: ").strip()

        if choice == "1":
            product_manager()

        elif choice == "2":
            sales_manager()

        elif choice == "3":
            print("Exiting program...")
            break
        
        else:
            print("Invalid option")

except Exception as e:
    print("\nSYSTEM ERROR OCCURRED")
    print("Please try again.")
    print(f"Error details: {e}")