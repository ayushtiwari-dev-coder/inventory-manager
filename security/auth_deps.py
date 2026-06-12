import os
from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, Request
from dotenv import load_dotenv
from database.sql_handler import User

DEFAULT_PERMISSIONS = {
    "owner": ["view_products", "add_product", "update_product", "delete_product", "record_sale", "view_sales", "view_analytics", "manage_org", "view_audit_logs"],
    "manager": ["view_products", "add_product", "update_product", "delete_product", "record_sale", "view_sales", "view_analytics", "view_audit_logs"],
    "employee": ["view_products", "record_sale", "add_product", "update_product", "delete_product"]
}

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def create_passport(user_id: int, org_id: int = None, role: str = None, username: str = None):
    expire = datetime.now(timezone.utc) + timedelta(days=5)
    token_data = {
        "user_id": user_id,
        "org_id": org_id,
        "role": role,
        "username": username,
        "exp": expire
    }
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(request: Request):
    """GLOBAL GATEKEEPER: Validates session and checks if user is globally active."""
    token = request.cookies.get("global_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user_db = User.get_user_by_id(user_id)
        if not user_db:
            raise HTTPException(status_code=403, detail="Account disabled globally.")

        return {"user_id": user_id, "username": username}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired! Please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


def get_org_access(request: Request):
    """WORKSPACE GATEKEEPER: Ensures token has org scope and verifies active membership."""
    token = request.cookies.get("org_token")
    if not token:
        raise HTTPException(status_code=401, detail="Workspace session required.")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        org_id: int = payload.get("org_id")
        role: str = payload.get("role")
        username: str = payload.get("username")

        if user_id is None or org_id is None or role is None:
            raise HTTPException(status_code=403, detail="Invalid token scope. Workspace selection required.")

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


class RequireRole:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_org_access)):
        user_role = current_user.get("role")
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Your current role '{user_role}' does not have permission to perform this action."
            )
        return current_user