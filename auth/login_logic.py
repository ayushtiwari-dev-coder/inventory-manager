import time
from security.hashing import hashing_password
from database.sql_handler import User


def login(username, password):
    user = User.get_user(username)

    if not user:
        return {
            "status": "error",
            "message": "Username does not exist"
        }

    lock_until = user["lock_until"]
    current_time = int(time.time())

    if current_time < lock_until:
        return {
            "status": "error",
            "message": "Account locked",
            "time_left": lock_until - current_time
        }

    if user["password_hash"] != hashing_password(password):

        # handle failed attempts externally if needed
        return {
            "status": "error",
            "message": "Wrong password"
        }

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

    if not any(c.isupper() for c in password):
        return {
            "status": "error",
            "message": "Password must contain uppercase letter"
        }

    if not any(c.isdigit() for c in password):
        return {
            "status": "error",
            "message": "Password must contain number"
        }

    if not any(not c.isalnum() for c in password):
        return {
            "status": "error",
            "message": "Password must contain special character"
        }

    if " " in password:
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