import os
from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from fastapi import HTTPException
from database.sql_handler import User


DEFAULT_PERMISSIONS = {
    "owner": [
        "view_products", "add_product", "update_product", "delete_product",
        "record_sale", "view_sales", "view_analytics", "manage_org", "view_audit_logs"
    ],
    "manager": [
        "view_products", "add_product", "update_product", "delete_product",
        "record_sale", "view_sales", "view_analytics", "view_audit_logs"
    ],
    "employee": [
        "view_products", "record_sale"
    ]
}

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# FastAPI token extractor
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_passport(user_id: int, org_id: int = None, role: str = None, username: str = None):
    """
    Creates a signed JWT. It packs the Organization ID and Role inside the token.
    If org_id is None, it means the user just logged in but hasn't selected a workspace yet.
    """
    expire = datetime.now(timezone.utc) + timedelta(days=5)
    token_data = {
        "user_id": user_id, 
        "org_id": org_id,
        "role": role,
        "username": username,
        "exp": expire
    }
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """GLOBAL GATEKEEPER: Validates session and checks if user is globally active."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # FIX: Check database to ensure user hasn't been globally banned since token was minted
        user_db = User.get_user_by_id(user_id)
        if not user_db:
            raise HTTPException(status_code=403, detail="Account disabled globally.")

        return {"user_id": user_id, "username": username}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired! Please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


def get_org_access(token: Annotated[str, Depends(oauth2_scheme)]):
    """WORKSPACE GATEKEEPER: Ensures token has org scope and verifies active membership."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        org_id: int = payload.get("org_id")
        role: str = payload.get("role")
        username: str = payload.get("username")

        # FIX: Hard-fail if this is a Global Token (missing org_id/role)
        if user_id is None or org_id is None or role is None:
            raise HTTPException(status_code=403, detail="Invalid token scope. Workspace selection required.")

        # Database Verification
        db_context = User.get_user_context(user_id, org_id)
        if not db_context:
            raise HTTPException(status_code=403, detail="Access denied. You are no longer active in this organization.")

        return {
            "user_id": user_id,
            "org_id": db_context["org_id"],
            "role": db_context["role"],
            "username": db_context["username"]
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired! Please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    


# 2. THE CHECKER FUNCTION (FastAPI Dependency)
class RequireRole:
    """
    This class acts as a filter on your main.py routes. 
    It takes a list of allowed roles, checks the current user's role from the token,
    and blocks them if they aren't on the list.
    """
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_org_access)):
        # 1. Get the user's role from their verified session
        user_role = current_user.get("role")
        
        # 2. Check if their role is in the allowed list for this specific action
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access Denied: Your current role '{user_role}' does not have permission to perform this action."
            )
        
        # 3. If they pass, hand the user data over to the route
        return current_user