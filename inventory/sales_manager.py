from inventory.product_manager import view_products_flow
from database.sql_handler import Sale  # Using Sale class for sales operations

def record_sale_flow(user_id):
    while True:
        if not view_products_flow(user_id):
            return

        try:
            user_input = input("Enter product ID (q for exit): ").strip()
            if user_input == "q":
                break
            product_id = int(user_input)
        except ValueError:
            print("Invalid product ID")
            continue

        try:
            quantity_input = input("Enter quantity sold (q to exit): ").strip()
            if quantity_input == "q":
                break
            quantity = int(quantity_input)
            if quantity <= 0:
                print("Quantity cannot be less than or equal to zero")
                continue
        except ValueError:
            print("Invalid quantity")
            continue

        result = Sale.record_sale(user_id, product_id, quantity)  # Using Sale class for sale operations

        if result["status"] == "invalid_product":
            print("Product not found")
            continue
        elif result["status"] == "insufficient_stock":
            print("Not enough stock available")
            continue
        elif result["status"] == "invalid_quantity":
            print("Invalid quantity")
            continue
        elif result["status"] == "success":
            print("\nSALE SUCCESSFUL")
            print("-" * 40)
            print(f"Product : {result['product_name']}")
            print(f"Quantity: {result['quantity']}")
            print(f"Total   : {result['total_sale']}")
            print("-" * 40)

        more = input("Record another sale? (yes/no): ").strip().lower()

        if more in ("yes", "y", "1"):
            continue
        elif more in ("no", "n", "2"):
            break
        else:
            print("Invalid input")

def sales_manager(user_id):
    while True:
        print("\nSALES MANAGER")
        print("1. Record Sale")
        print("2. Back")

        choice = input("Enter choice: ").strip()

        if choice == "1":
            record_sale_flow(user_id)
        elif choice == "2":
            break
        else:
            print("Invalid option")