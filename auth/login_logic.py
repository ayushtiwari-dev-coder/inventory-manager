import time
from security.hashing import hashing_password,check_password
from database.sql_handler import User

def login(username, password):
    user = User.get_user(username)
    if not user:
        return {
            "status": "error",
            "message": "Username does not exist"
        }

    # 1. Check if the account is currently locked
    current_time = int(time.time())
    lock_until = user.get("lock_until", 0)
    
    if current_time < lock_until:
        return {
            "status": "error",
            "message": "Account locked",
            "time_left": lock_until - current_time
        }

    # 2. Check the password 
    if not check_password(password,user["password_hash"]):
        attempts = user.get("failed_attempts", 0) + 1
        
        if attempts >= 3:
            # Lock for 5 minutes (300 seconds)
            User.update_lock(username, current_time + 300)
            User.update_failed_attempts(username, 0) # Reset after lock
            return {
                "status": "error",
                "message": "Account locked",
                "time_left": 300
            }
        
        # Update the database with the new failed count
        User.update_failed_attempts(username, attempts)
        return {
            "status": "error",
            "message": "Wrong password",
            "attempts_left": 3 - attempts
        }

    # 3. Successful login - Reset attempts back to 0
    User.update_failed_attempts(username, 0)
    return {
        "status": "success",
        "data": {
            "user_id": user["user_id"],
            "username": user["username"],
            "name": user["name"]
        }
    }

def create_account(username, password, name):

    username = username.strip().lower()

    if username == "":
        return {
            "status": "error",
            "message": "Username cannot be empty"
        }

    if " " in username:
        return {
            "status": "error",
            "message": "Username cannot contain spaces"
        }

    if len(username) > 20:
        return {
            "status": "error",
            "message": "Username too long"
        }

    if not username.replace("_", "").replace("-", "").isalnum():
        return {
            "status": "error",
            "message": "Username can only contain letters, numbers, _ and -"
        }

    if User.get_user(username):
        return {
            "status": "error",
            "message": "Username already exists"
        }

    if len(password) < 8:
        return {
            "status": "error",
            "message": "Password too short"
        }

    if len(password) > 32:
        return {
            "status": "error",
            "message": "Password too long"
        }

    has_uppercase = False
    has_digit = False
    has_special = False
    has_space = False

    for c in password:
        if c.isupper():
            has_uppercase = True
        elif c.isdigit():
            has_digit = True
        elif not c.isalnum():
            has_special = True
            if c == " ":
                has_space = True

    if not has_uppercase:
        return {
            "status": "error",
            "message": "Password must contain uppercase letter"
        }

    if not has_digit:
        return {
            "status": "error",
            "message": "Password must contain number"
        }

    if not has_special:
        return {
            "status": "error",
            "message": "Password must contain special character"
        }

    if has_space:
        return {
            "status": "error",
            "message": "Password cannot contain spaces"
        }

    if name == "":
        return {
            "status": "error",
            "message": "Name cannot be empty"
        }

    if len(name) > 25:
        return {
            "status": "error",
            "message": "Name too long"
        }

    if not name.replace(" ", "").isalnum():
        return {
            "status": "error",
            "message": "Name must contain only letters and numbers"
        }

    password_hash = hashing_password(password)

    User.create_user(username, password_hash)
    User.update_name(username, name)

    user = User.get_user(username)

    return {
        "status": "success",
        "data": {
            "user_id": user["user_id"],
            "username": user["username"],
            "name": user["name"]
        }
    }