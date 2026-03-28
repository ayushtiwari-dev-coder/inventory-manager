
from database.sql_handler import create_tables
from auth.login_logic import create_account, login
from controller_inventory import inventory_system
create_tables()
while True:
    
    print("\n" + "="*45)
    print("LOGIN SYSTEM")
    print("="*45)

    print("\n1. Create Account")
    print("2. Login")
    print("3. Exit\n")

    choice = input("Enter your choice: ").strip()

    if choice == "1":
        user_id = create_account()  # Get user_id after account creation
        print("\nAccount created. Please login.\n")
        inventory_system(user_id)  # Pass user_id to inventory system

    elif choice == "2":
        user_id = login()  # Get user_id after login
        if user_id:
            inventory_system(user_id)  # Pass user_id to inventory system
        else:
            print("Too many wrong attempts. Account locked.")
            

    elif choice == "3":
        print("Exiting program.")
        break

    else:
        print("Invalid option.")