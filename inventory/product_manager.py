from utils.validation import valid_product_name
from database.sql_handler import Product


def view_products_flow(user_id,low_stock_threshold=None):
    products = Product.get_all_products(user_id,low_stock_threshold)  # Using Product class to get all products

    if not products:
        print("\nNo products found.\n")
        return False

    print("\nPRODUCT LIST")
    print("-" * 60)
    print(f"{'ID':<5} {'Name':<20} {'MRP':<10} {'Stock':<10}")
    print("-" * 60)

    for product in products:
        print(
            f"{product['product_id']:<5} "
            f"{product['product_name']:<20} "
            f"{product['mrp']:<10} "
            f"{product['stock']:<10}"
        )

    print("-" * 60)
    return True


def delete_products_flow(user_id):
    if not view_products_flow(user_id):
        return

    while True:
        try:
            product_id = input("Enter product ID to delete or enter (q to exit) : ").strip()
            if product_id in ["exit","q"]:
                break
            elif product_id.isdigit():
                product_id=int(product_id)
            else:
                print("invalid input")
                continue
            choice=input(f"ARE u sure u want to delete product id {product_id},YOU will lose all data related to that product 1.yes or 2.no: ")
            if choice in ["no","2"]:
                continue
            elif choice not in ["yes","y","1"]:
                print("invalid input")
                continue
            else:
                print("as u say")
        except ValueError:
            print("Invalid ID")
            continue
        
        result = Product.delete_product(user_id, product_id)  # Using Product class to delete product
        if result["status"] == "not_found":
            print("Product not found")
            continue
        elif result["status"] == "success":
            print("Product deleted successfully")
            break


def update_product_flow(user_id):
    while True:
        products = Product.get_all_products(user_id)  # Using Product class to get all products
        if not products:
            print("No products found.")
            return
        
        print("\n1. Update product MRP")
        print("2. Update profit margin")
        print("3.update stock")
        print("4. Back")

        choice = input("Enter your choice: ").strip()

        if choice == "4":
            break

        if choice not in ("1", "2","3"):
            print("Invalid option")
            continue

        # Show products
        print("\nPRODUCT LIST")
        print("-" * 60)
        print(f"{'ID':<5} {'Name':<20} {'MRP':<10} {'Stock':<10}")
        print("-" * 60)

        for product in products:
            print(
                f"{product['product_id']:<5} "
                f"{product['product_name']:<20} "
                f"{product['mrp']:<10} "
                f"{product['stock']:<10}"
            )

        print("-" * 60)

        while True:
            try:
                product_id = int(input("Enter product ID: "))
            except ValueError:
                print("Invalid product ID")
                continue

            # Find product in list
            selected_product = None
            for product in products:
                if product["product_id"] == product_id:
                    selected_product = product
                    break

            if selected_product is None:
                print("Product not found")
                continue

            if choice == "3":
                try:
                    change = int(input("Enter stock change (positive to add, negative to remove): "))
                except ValueError:
                    print("Invalid input")
                    continue
                
                result = Product.update_stock(user_id, product_id, change)
                
                if result["status"] == "insufficient_stock":
                    print("Cannot remove more stock than available.")
                    continue
                elif result["status"] == "not_found":
                    print("Product not found.")
                    continue
                
                print("Stock updated successfully.")
                break

            try:
                new_value = float(input("Enter new value: "))
            except ValueError:
                print("Invalid number")
                continue

            # Updating MRP
            if choice == "1":
                if new_value <= 0:
                    print("MRP must be greater than 0")
                    continue
                if new_value > 99999999:
                    print("Value too large")
                    continue
                result = Product.update_product_price(user_id, product_id, new_value)  # Using Product class to update price

            # Updating margin
            elif choice=="2":
                mrp = selected_product["mrp"]

                if new_value >= mrp:
                    print("Profit margin cannot be >= MRP")
                    continue
                if new_value > 99999999:
                    print("Value too large")
                    continue

                result = Product.update_profit_margin(user_id, product_id, new_value)  # Using Product class to update profit margin
            if result["status"]=="not_found":
                print("product not found")
                break
            elif result["status"]=="success":
                print("product updated successfully")
                break

def add_product_flow(user_id):
    while True:
        try:
            product_name = input("Enter product name: ").strip().lower()
            if not product_name:
                print("Product name cannot be empty")
                continue

            if len(product_name) > 50:
                print("Product name too long")
                continue

            if not valid_product_name(product_name):
                print("Invalid characters in product name")
                continue

            mrp = float(input("Enter MRP: "))
            if mrp <= 0:
                print("MRP should be greater than zero")
                continue
            if mrp > 99999999.99:
                print("MRP value too large")
                continue

            profit_margin = float(input("Enter margin: "))

            if profit_margin >= mrp:
                print("Profit margin cannot be >= MRP")
                continue

            if profit_margin > 99999999.99:
                print("Margin is too big")
                continue

            stock = int(input("Enter stock quantity: "))
            if stock < 0:
                print("Stock should be greater than or equal to zero")
                continue
        except ValueError:
            print("Invalid input")
            continue

        result = Product.add_product(user_id, product_name, mrp, stock, profit_margin)  # Using Product class to add product

        if result["status"] == "duplicate_product":
            print("Product already exists")
            continue
        elif result["status"] == "success":
            print("Product added successfully")

        more = input("Add another product? 1. Yes  2. No: ").strip().lower()

        if more in ["yes", "y", "1"]:
            continue
        elif more in ["no", "2"]:
            break
        else:
            print("Invalid input")
            continue




def product_manager(user_id):
    while True:
        print("\nPRODUCT MANAGER")
        print("1. View products")
        print("2. Add product")
        print("3. Update product")
        print("4. Delete product")
        print("5. Back")

        choice = input("Enter your choice: ").strip()

        if choice == "1":
            view_products_flow(user_id)

        elif choice == "2":
            add_product_flow(user_id)

        elif choice == "3":
            update_product_flow(user_id)

        elif choice == "4":
            delete_products_flow(user_id)

        elif choice == "5":
            break

        else:
            print("Invalid option")