import os
import time
from security.hashing import hashing_password, check_password
from database.sql_handler import User
from database.org_manager import OrgManager
from dotenv import load_dotenv

load_dotenv()

# 1. JOIN MY APP (The Front Door Gatekeeper)
def verify_app_access(submitted_code):
    """
    Called by the frontend before showing the Login/Register screens.
    If this fails, the user cannot even attempt to hit the database.
    """
    master_code = os.getenv("MASTER_ENTRY_CODE")
    if not master_code or submitted_code != master_code:
        return {"status": "error", "message": "Unauthorized: Invalid App Entry Code"}
    return {"status": "success", "message": "Access Granted"}

# 2. CREATE ACCOUNT
def create_account(username, password, name, master_code):
    """Creates the global user identity. Still requires the master code as a secondary safety check."""
    verify_check = verify_app_access(master_code)
    if verify_check["status"] == "error":
        return verify_check

    username = username.strip().lower()
    if username == "":
        return {"status": "error", "message": "Username cannot be empty"}
    if " " in username:
        return {"status": "error", "message": "Username cannot contain spaces"}
    if len(username) > 20:
        return {"status": "error", "message": "Username too long"}
    if not username.replace("_", "").replace("-", "").isalnum():
        return {"status": "error", "message": "Username can only contain letters, numbers, and dashes"}
    
    if User.get_user(username):
        return {"status": "error", "message": "Username already exists"}

    if len(password) < 8:
        return {"status": "error", "message": "Password too short"}
    if len(password) > 32:
        return {"status": "error", "message": "Password too long"}
    if not any(c.isupper() for c in password):
        return {"status": "error", "message": "Password must contain an uppercase letter"}
    if not any(c.isdigit() for c in password):
        return {"status": "error", "message": "Password must contain a number"}
    if not any(not c.isalnum() for c in password):
        return {"status": "error", "message": "Password must contain a special character"}
    if " " in password:
        return {"status": "error", "message": "Password cannot contain spaces"}

    if name == "":
        return {"status": "error", "message": "Name cannot be empty"}
    if len(name) > 25:
        return {"status": "error", "message": "Name too long"}
    if not name.replace(" ", "").isalnum():
        return {"status": "error", "message": "Name must contain only letters and numbers"}

    password_hash = hashing_password(password)
    
    result = User.create_user(username, password_hash, name, None)
    if result.get("status") == "success":
        user = User.get_user(username)
        return {
            "status": "success",
            "data": {
                "user_id": user["user_id"],
                "username": user["username"],
                "name": user["name"]
            }
        }
    return result

# 3. LOGIN
def login(username, password):
    """Authenticates the user and returns their multi-tenant organization context."""
    user = User.get_user(username)
    
    if not user:
        return {"status": "error", "message": "Username does not exist"}

    current_time = int(time.time())
    lock_until = user.get("lock_until", 0)

    if current_time < lock_until:
        return {"status": "error", "message": "Account locked", "time_left": lock_until - current_time}

    if not check_password(password, user["password_hash"]):
        attempts = user.get("failed_attempts", 0) + 1
        if attempts >= 3:
            User.update_lock(username, current_time + 300)
            User.update_failed_attempts(username, 0)
            return {"status": "error", "message": "Account locked due to multiple failed attempts", "time_left": 300}
        
        User.update_failed_attempts(username, attempts)
        return {"status": "error", "message": "Wrong password", "attempts_left": 3 - attempts}

    User.update_failed_attempts(username, 0)
    
    # Extract workspace context
    context = User.get_user_context(user["user_id"])
    
    return {
        "status": "success",
        "data": {
            "user_id": user["user_id"],
            "username": user["username"],
            "name": user["name"],
            # If they belong to multiple orgs, we can return the list here for the frontend selector
            "workspaces": context if isinstance(context, list) else [context] if context else []
        }
    }

# 4. CREATE ORGANIZATION
def create_organization(user_id, org_name, owner_gmail=None):
    """Passes the validated user action down to the database manager."""
    if not org_name or len(org_name.strip()) == 0:
        return {"status": "error", "message": "Organization name cannot be empty."}
    return OrgManager.create_organization(org_name.strip(), user_id, owner_gmail)

# 5. JOIN ORGANIZATION
def join_organization(user_id, join_code):
    """Attempts to bind a user to a workspace using an invite code."""
    if not join_code or len(join_code.strip()) != 6:
        return {"status": "error", "message": "Invalid join code format. Must be 6 characters."}
    return OrgManager.join_organization(user_id, join_code.strip().upper())

def activate_workspace(user_id, org_id):
    """
    Validates specific tenant membership before the token exchange mints an org-scoped JWT.
    """
    context = User.get_user_context(user_id, org_id)
    
    if not context:
        return {"status": "error", "message": "Invalid workspace or inactive membership."}
        
    return {"status": "success", "data": context}