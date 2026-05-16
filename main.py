import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel
from typing import List, Optional

# --- SECURITY & GATEKEEPERS ---
from security.auth_deps import get_current_user, get_org_access, RequireRole, create_passport

# --- LOGIC MANAGERS (Bypass Fixed) ---
from database.sql_handler import Database
from database.org_manager import OrgManager
from auth import login_logic
from inventory import product_manager, sales_manager
from analytics.report import analytics

# --- INITIALIZATION ---
app = FastAPI(title="Multi-Tenant Inventory SaaS")

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
    org_name: str
    owner_gmail: Optional[str] = None

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



# 1. AUTHENTICATION & IDENTITY (Unprotected)

@app.post("/register")
def register(data: RegisterRequest):
    result = login_logic.create_account(data.username, data.password, data.name, data.master_code)
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message", "Registration failed"))
    return result

@app.post("/login")
def user_login(data: LoginRequest):
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
def select_workspace(data: WorkspaceSelect, user: dict = Depends(get_current_user)):
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
def create_workspace(data: CreateOrgRequest, user: dict = Depends(get_current_user)):
    result = OrgManager.create_organization(data.org_name, user["user_id"], data.owner_gmail)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/org/join")
def join_workspace(data: JoinOrgRequest, user: dict = Depends(get_current_user)):
    result = OrgManager.join_organization(user["user_id"], data.join_code)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result



# 3. INVENTORY ROUTES (Org-Scoped Token Required)


@app.get("/products")
def view_products_api(user: dict = Depends(RequireRole(["owner", "manager", "employee"]))):
    # Now routed safely through the Manager Layer!
    return product_manager.get_products(user["org_id"])

@app.post("/products")
def create_product(data: ProductCreate, user: dict = Depends(RequireRole(["owner", "manager"]))):
    # Validation constraints run cleanly via the Manager
    result = product_manager.add_product(
        org_id=user["org_id"], user_id=user["user_id"], username=user["username"],
        product_name=data.product_name, selling_price=data.selling_price, 
        stock=data.stock, cost_price=data.cost_price
    )
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.put("/products/update")
def update_product_api(data: ProductUpdate, user: dict = Depends(RequireRole(["owner", "manager"]))):
    result = product_manager.update_product_full(
        org_id=user["org_id"], user_id=user["user_id"], username=user["username"],
        product_id=data.product_id, selling_price=data.selling_price, 
        cost_price=data.cost_price, stock_change=data.stock_change
    )
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.delete("/products/{product_id}")
def remove_product(product_id: int, user: dict = Depends(RequireRole(["owner", "manager"]))):
    result = product_manager.delete_product(user["org_id"], user["user_id"], user["username"], product_id)
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result



# 4. SALES ROUTES (Org-Scoped Token Required)


@app.post("/sales")
def create_sale(data: SaleCreate, user: dict = Depends(RequireRole(["owner", "manager", "employee"]))):
    items = [{"product_id": item.product_id, "quantity": item.quantity} for item in data.items]
    
    # Validation intercepts safely via sales_manager
    result = sales_manager.record_sale(user["org_id"], user["user_id"], user["username"], items)
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.get("/sales/recent")
def recent_sales(user: dict = Depends(RequireRole(["owner", "manager"]))):
    return sales_manager.get_recent_sales(user["org_id"])



# 5. ANALYTICS ROUTES (Org-Scoped Token Required)


@app.get("/alerts/low-stock")
def low_stock(user: dict = Depends(RequireRole(["owner", "manager", "employee"]))):
    return product_manager.get_low_stock_products(user["org_id"])

# (For the future: Just add your other analytics.py routes here wrapped with RequireRole(["owner", "manager"]))

# App mount for the frontend folder
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")