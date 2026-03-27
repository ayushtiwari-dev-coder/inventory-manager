from database.sql_handler import get_all_products,delete_product,update_product_price,update_profit_margin,add_product
from utils.validation import valid_product_name
def view_products_flow(user_id):
    products = get_all_products(user_id)

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
    if view_products_flow(user_id) is False:
        return
    while True:
        try:
            product_id=int(input("enter product id to delete: ").strip())
        except ValueError:
            print("invalid id")
            continue
        result=delete_product(user_id,product_id)
        if result["status"]=="not_found":
            print("product not found")
            continue
        elif result["status"]=="success":
            print("product deleted sucessfully")
            break

def update_product_flow(user_id):

    while True:
        products = get_all_products(user_id)
        if not products:
            print("No products found.")
            return
        print("\n1. Update product MRP")
        print("2. Update profit margin")
        print("3. Back")

        choice = input("Enter your choice: ").strip()

        if choice == "3":
            break

        if choice not in ("1", "2"):
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
                if new_value>99999999:
                    print("value to large")
                    continue

                result = update_product_price(user_id,product_id, new_value)

            # Updating margin
            else:

                mrp = selected_product["mrp"]

                if new_value >= mrp:
                    print("Profit margin cannot be >= MRP")
                    continue
                if new_value>99999999:
                    print("value to large")
                    continue

                result = update_profit_margin(user_id,product_id, new_value)

            if result["status"] == "not_found":
                print("Product not found. Try again.")
                continue

            print("Product updated successfully.")
            products=get_all_products(user_id)
            break

def add_product_flow(user_id):
    while True:
        try:
            product_name=input("Enter product name: ").strip().lower()
            if not product_name:
                print("product name cannot be empty")
                continue

            if len(product_name)>50:
                    print("product name too long")
                    continue
            
            if not valid_product_name(product_name):
                print("invalid characters in product name")
                continue
                
            mrp=float(input("Enter MRP: "))
            if mrp<=0:
                print("mrp should be greater than zero")
                continue
            if mrp>99999999.99:
                print("mrp value too large")
                continue

            profit_margin=float(input("Enter margin: "))

            if profit_margin>=mrp:
                print("profit margin cannot be >= mrp")
                continue

            if profit_margin>99999999.99:
                print("margin is to big")
                continue

            stock=int(input("enter stock quantity: "))
            if stock<0:
                print("stock should be greater than or equal to zero")
                continue
        except ValueError:
            print("invalid input")
            continue
        result=add_product(user_id,product_name,mrp,stock,profit_margin)
        if result["status"]=="duplicate_product":
            print("product already exist")
            continue
        elif result["status"]=="success":
            print("product added sucessfully")
        more=input("add another product 1.yes or 2.no: ").strip().lower()
        if more in ["yes","y","1"]:
            continue
        elif more in ["no","2"]:
            break
        else:
            print("invalid input")
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