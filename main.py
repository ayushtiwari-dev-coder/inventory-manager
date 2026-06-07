# LOCATION: main.py
############################################################
import os
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

# --- SLOWAPI RATE LIMITING ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- SECURITY & GATEKEEPERS ---
from security.auth_deps import get_current_user, get_org_access, RequireRole, create_passport
from auth import org_credential_manager

# --- LOGIC MANAGERS ---
from database.sql_handler import Database
from database.org_manager import OrgManager
from auth import login_logic
from inventory import product_manager, sales_manager
from analytics.report import analytics

# --- INITIALIZATION ---
app = FastAPI(title="Multi-Tenant Inventory SaaS")

# Initialize Rate Limiter (Tracks by User IP)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 1. CORS Fixed: Browsers will now accept credentialed tokens cleanly
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Initialize Database tables
Database.create_tables()


# GLOBAL EXCEPTION HANDLERS
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    error_details = exc.errors()
    if error_details:
        loc = error_details[0].get("loc", ["input"])[-1]
        msg = error_details[0].get("msg", "Invalid input configuration value")
        clean_message = f"Validation Error: Field '{loc}' failed validation - {msg}." 
    else:
        clean_message = "Validation Error: Provided request payload does not match expected model schema." 
        
    return JSONResponse(
        status_code=422,
        content={"status": "error", "message": clean_message}
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code, 
        content={"status": "error", "message": exc.detail}
    )

@app.exception_handler(Exception)
async def universal_generic_exception_handler(request, exc: Exception):
    # Pass through SlowAPI rate limit exceptions cleanly
    if isinstance(exc, RateLimitExceeded):
        return _rate_limit_exceeded_handler(request, exc)
        
    print(f"CRITICAL SYSTEM ERROR LOG: {str(exc)}")
    return JSONResponse(
        status_code=500, 
        content={"status": "error", "message": "An unexpected system exception occurred inside the core server pipeline."}
    )


# REQUEST MODELS (Pydantic Schemas)

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    master_code: str

class WorkspaceSelect(BaseModel):
    org_id: int

class CreateOrgRequest(BaseModel):
    org_name: str = Field(..., min_length=1, max_length=40)
    owner_gmail: Optional[str] = None

    @field_validator('org_name')
    @classmethod
    def check_org_name_syntax(cls, value: str) -> str:
        # Calls the external validation function
        return org_credential_manager.validate_org_name(value)

    @field_validator('owner_gmail')
    @classmethod
    def check_gmail_syntax(cls, value: Optional[str]) -> Optional[str]:
        # Calls the external validation function
        return org_credential_manager.validate_owner_gmail(value)

class JoinOrgRequest(BaseModel):
    join_code: str

class ProductCreate(BaseModel):
    product_name: str
    selling_price: float
    stock: int
    cost_price: float

class ProductUpdate(BaseModel):
    product_id: int
    selling_price: float | None = None
    cost_price: float | None = None
    stock_change: int | None = None

class SaleItem(BaseModel):
    product_id: int
    quantity: int

class SaleCreate(BaseModel):
    items: List[SaleItem]

class ChangeRoleRequest(BaseModel):
    target_user_id: int
    new_role: str


# 1. AUTHENTICATION & IDENTITY (Unprotected)

@app.post("/register")
@limiter.limit("3/minute")
def register(request: Request, data: RegisterRequest):
    result = login_logic.create_account(data.username, data.password, data.name, data.master_code)
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message", "Registration failed"))
    return result

@app.post("/login")
@limiter.limit("5/minute")
def user_login(request: Request, data: LoginRequest):
    result = login_logic.login(data.username, data.password)
    if result.get("status") != "success":
        raise HTTPException(status_code=401, detail=result.get("message"))
    
    user_data = result["data"]
    global_token = create_passport(user_id=user_data["user_id"], username=user_data["username"])
    
    return { 
        "status": "success", 
        "global_token": global_token, 
        "data": user_data
    }


# 2. WORKSPACE SELECTION (Global Token Required)

@app.post("/auth/workspace/select")
@limiter.limit("30/minute")
def select_workspace(request: Request, data: WorkspaceSelect, user: dict = Depends(get_current_user)):
    result = login_logic.activate_workspace(user["user_id"], data.org_id)
    if result["status"] == "error":
        raise HTTPException(status_code=403, detail=result["message"])
    
    org_data = result["data"]
    org_token = create_passport(
        user_id=user["user_id"], 
        username=user["username"], 
        org_id=org_data["org_id"], 
        role=org_data["role"]
    )
    
    return { 
        "status": "success", 
        "org_token": org_token, 
        "role": org_data["role"], 
        "org_id": org_data["org_id"]
    }

@app.post("/org/create")
@limiter.limit("5/minute")
def create_workspace(request: Request, data: CreateOrgRequest, user: dict = Depends(get_current_user)):
    result = OrgManager.create_organization(data.org_name, user["user_id"], data.owner_gmail)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/org/join")
@limiter.limit("10/minute")
def join_workspace(request: Request, data: JoinOrgRequest, user: dict = Depends(get_current_user)):
    result = OrgManager.join_organization(user["user_id"], data.join_code)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
        
    org_token = create_passport(
        user_id=user["user_id"], 
        username=user["username"], 
        org_id=result["org_id"], 
        role=result["role"]
    )
    
    return { 
        "status": "success", 
        "org_token": org_token, 
        "role": result["role"], 
        "org_id": result["org_id"]
    }

@app.get("/org/profile")
@limiter.limit("60/minute")
def view_organization_profile(request: Request, user: dict = Depends(get_org_access)):
    result = OrgManager.get_org_profile(user["org_id"], user["role"])
    
    if not result:
        raise HTTPException(status_code=404, detail="Workspace profile not found or inactive.")
        
    if isinstance(result, dict) and result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message", "Internal database lookup failure."))
        
    return { "status": "success", "data": result }


# 3. INVENTORY ROUTES (Org-Scoped Token Required)

@app.get("/products")
@limiter.limit("120/minute")
def view_products_api(request: Request, user: dict = Depends(RequireRole(["owner", "manager", "employee"]))):
    return product_manager.get_products(user["org_id"])

@app.post("/products")
@limiter.limit("30/minute")
def create_product(request: Request, data: ProductCreate, user: dict = Depends(RequireRole(["owner", "manager","employee"]))):
    result = product_manager.add_product(
        org_id=user["org_id"], 
        user_id=user["user_id"], 
        username=user["username"], 
        product_name=data.product_name, 
        selling_price=data.selling_price, 
        stock=data.stock, 
        cost_price=data.cost_price
    )
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.put("/products/update")
@limiter.limit("30/minute")
def update_product_api(request: Request, data: ProductUpdate, user: dict = Depends(RequireRole(["owner", "manager","employee"]))):
    result = product_manager.update_product_full(
        org_id=user["org_id"], 
        user_id=user["user_id"], 
        username=user["username"], 
        product_id=data.product_id, 
        selling_price=data.selling_price, 
        cost_price=data.cost_price, 
        stock_change=data.stock_change
    )
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.delete("/products/{product_id}")
@limiter.limit("30/minute")
def remove_product(request: Request, product_id: int, user: dict = Depends(RequireRole(["owner", "manager","employee"]))):
    result = product_manager.delete_product(user["org_id"], user["user_id"], user["username"], product_id)
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


# 4. SALES ROUTES (Org-Scoped Token Required)

@app.post("/sales")
@limiter.limit("60/minute")
def create_sale(request: Request, data: SaleCreate, user: dict = Depends(RequireRole(["owner", "manager", "employee"]))):
    items = [{"product_id": item.product_id, "quantity": item.quantity} for item in data.items]
    result = sales_manager.record_sale(user["org_id"], user["user_id"], user["username"], items)
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.get("/sales/recent")
@limiter.limit("120/minute")
def recent_sales(request: Request, user: dict = Depends(RequireRole(["owner", "manager"]))):
    return sales_manager.get_recent_sales(user["org_id"])


# 5. ANALYTICS ROUTES (Org-Scoped Token Required)

@app.get("/analytics/revenue")
@limiter.limit("120/minute")
def get_revenue_summary(request: Request, period: Optional[str] = None, user: dict = Depends(RequireRole(["owner", "manager"]))):
    return analytics.revenue_summary(user["org_id"], period)

@app.get("/api/logs")
@limiter.limit("60/minute")
def get_audit_logs(request: Request, limit: int = 100, user: dict = Depends(RequireRole(["owner", "manager"]))):
    try:
        logs = OrgManager.get_organization_audit_logs(user["org_id"], limit=limit)
        return {"status": "success", "data": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/top-profitable")
@limiter.limit("120/minute")
def get_top_profitable(request: Request, user: dict = Depends(RequireRole(["owner", "manager"]))):
    return analytics.top_products_by_profit(user["org_id"])

@app.get("/analytics/least-sold")
@limiter.limit("120/minute")
def get_least_sold(request: Request, user: dict = Depends(RequireRole(["owner", "manager"]))):
    return analytics.least_sold_products(user["org_id"])

@app.get("/analytics/trend")
@limiter.limit("120/minute")
def get_sales_trend(request: Request, months: int=4, user: dict = Depends(RequireRole(["owner", "manager"]))):
    return analytics.sales_trend(user["org_id"], months)

@app.get("/alerts/low-stock")
@limiter.limit("120/minute")
def low_stock(request: Request, user: dict = Depends(RequireRole(["owner", "manager", "employee"]))):
    return product_manager.get_low_stock_products(user["org_id"])


# 6. MEMBERS & EMPLOYEES ROUTES (Org-Scoped Token Required)

@app.get("/org/members")
@limiter.limit("60/minute")
def get_org_members_api(request: Request, user: dict = Depends(RequireRole(["owner", "manager"]))):
    members = OrgManager.get_org_members(user["org_id"])
    return {"status": "success", "data": members}
@app.delete("/org/members/{target_user_id}")
@limiter.limit("20/minute")
def remove_member_api(request: Request, target_user_id: int, user: dict = Depends(RequireRole(["owner", "manager"]))):
    if user["user_id"] == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself from this menu.")
    
    # FIX: Pass the user["role"] into the function so the DB can verify hierarchy
    result = OrgManager.remove_member(user["org_id"], target_user_id, user["user_id"], user["username"], user["role"])
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.put("/org/members/role")
@limiter.limit("20/minute")
def change_member_role_api(request: Request, data: ChangeRoleRequest, user: dict = Depends(RequireRole(["owner"]))):
    if user["user_id"] == data.target_user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")
    
    result = OrgManager.change_member_role(user["org_id"], data.target_user_id, user["user_id"], user["username"], data.new_role)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.get("/org/members/banned")
@limiter.limit("30/minute")
def get_banned_users_api(request: Request, user: dict = Depends(RequireRole(["owner"]))):
    banned = OrgManager.get_banned_users(user["org_id"])
    return {"status": "success", "data": banned}

@app.delete("/org/members/banned/{target_user_id}")
@limiter.limit("20/minute")
def unban_user_api(request: Request, target_user_id: int, user: dict = Depends(RequireRole(["owner"]))):
    result = OrgManager.unban_user(user["org_id"], target_user_id, user["user_id"], user["username"])
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


# STATIC FILES
app.mount("/", StaticFiles(directory="frontend_react/dist", html=True), name="frontend")