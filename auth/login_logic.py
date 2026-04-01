import time
from security.hashing import hashing_password
from database.sql_handler import User, Product

def password_attempt(username):
    user = User.get_user(username)  # Calling User class method
    attempts = 0

    while attempts < 3:
        password = input("Enter your password:")

        if user["password_hash"] == hashing_password(password):
            print("Login successfully")
            return user["user_id"]

        else:
            print("Wrong password, try again")
            attempts += 1

    lock_until = int(time.time()) + 300
    User.update_lock(username, lock_until)  # Calling User class method to update lock

    return None


def setup_name(username):
    user = User.get_user(username)  # Calling User class method

    print("\n" + "=" * 40)
    print("PROFILE SETUP")
    print("=" * 40)

    while True:
        name = input("Enter your name: ").title().strip()
        error = False

        if name == "":
            print("Name cannot be empty")
            error = True

        if len(name) > 25:
            print("Name is too long")
            error = True

        if not name.replace(" ", "").isalnum():
            print("Name should only contain alphabet and numbers")
            error = True

        if not error:
            User.update_name(username, name)  # Calling User class method to update name
            return name


def create_account():
    while True:
        username = input("Enter username: ").strip().lower()
        error = False

        if username == "":
            print("Username cannot be empty")
            error = True
        if " " in username:
            print("Username cannot contain spaces")
            error = True
        if len(username) > 20:
            print("Username too long")
            error = True
        if not username.replace("_", "").replace("-", "").isalnum():
            print("Username can only contain letters, numbers, _ and -")
            error = True
        if User.get_user(username):  # Calling User class method
            print("Username already exists")
            error = True

        if error:
            continue

        print("Username available")

        while True:
            password = input("Enter password:")
            error = False

            if len(password) < 8:
                print("Password too short")
                error = True
            if len(password) > 32:
                print("Password too long")
                error = True
            if not any(c.isupper() for c in password):
                print("Password needs uppercase")
                error = True
            if not any(c.isdigit() for c in password):
                print("Password needs number")
                error = True
            if not any(not c.isalnum() for c in password):
                print("Password needs special char")
                error = True
            if " " in password:
                print("No spaces allowed")
                error = True

            if not error:
                password_hash = hashing_password(password)
                User.create_user(username, password_hash)  # Calling User class method to create user

                name = setup_name(username)
                User.update_name(username,name)
                print("Account created successfully")

                user = User.get_user(username)  # Fetch user after creation
                return user["user_id"],user["name"]  # Return the user_id of the created user


def login():
    while True:
        username = input("Enter your username:")
        user = User.get_user(username)  # Calling User class method

        if not user:
            print("Username does not exist")
            continue

        lock_until = user["lock_until"]
        current_time = int(time.time())

        if current_time < lock_until:
            print("Account locked")
            print("Time left:", lock_until - current_time)
            return None

        user_id = password_attempt(username)

        if user_id:
            return user_id  # Return user_id after successful login
        else:
            return None