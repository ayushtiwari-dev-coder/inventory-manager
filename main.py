from database.sql_handler import Database,User
from auth.login_logic import create_account, login
from controller_inventory import inventory_system
from auth.session_manager import load_session,clear_session,save_session
Database.create_tables()
session=load_session()
if session:
    print("\n welcome back")
    inventory_system(session["user_id"])
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
        user=User.create_user(user_id)
        save_session({"user_id":user_id , "name":user["name"]})
        print("\nAccount created. Please login.\n")
        inventory_system(user_id)  # Pass user_id to inventory system

    elif choice == "2":
        user_id = login()  # Get user_id after login
        if user_id:
            user=User.get_user_by_id(user_id)
            save_session({"user_id":user_id , "name":user["name"]})
            inventory_system(user_id)  # Pass user_id to inventory system
        else:
            print("Too many wrong attempts. Account locked.")
            

    elif choice == "3":
        print("Exiting program.")
        break

    else:
        print("Invalid option.")