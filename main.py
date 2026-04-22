import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# --- YOUR LOGIC IMPORTS ---
from database.sql_handler import Database
from auth.login_logic import create_account, login
from inventory.product_manager import (
    get_products, add_product, update_product_price,
    update_profit_margin, update_stock, delete_product
)
from inventory.sales_manager import record_sale,get_recent_sales
from analytics.report import analytics
from controller_inventory import get_low_stock_products

# --- INITIALIZATION ---
load_dotenv()
app = FastAPI()

# This is critical for your phone to talk to your laptop
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = "HS256"

# This looks for the token in the "Authorization" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

Database.create_tables()

# --- THE TOKEN FACTORY ---

def create_passport(user_id: int):
    """
    Creates a signed 5-day ID card (Token).
    """
    expire = datetime.now(timezone.utc) + timedelta(days=5)
    token_data = {"user_id": user_id, "exp": expire}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return token

# --- SECURITY HELPERS (The Gatekeeper) ---

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """
    Decodes the token. If it's fake or expired, it throws a 401 error.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid ID card")
        return {"user_id": user_id}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired! Log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# --- REQUEST MODELS ---

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str

class ProductCreate(BaseModel):
    product_name: str
    mrp: float
    stock: int
    profit_margin: float

class ProductPriceUpdate(BaseModel):
    product_id: int
    new_mrp: float

class StockUpdate(BaseModel):
    product_id: int
    change: int

class ProductMarginUpdate(BaseModel):
    product_id: int
    new_margin: float

class SaleCreate(BaseModel):
    product_id: int
    quantity: int

# --- AUTH ROUTES ---

@app.post("/login")
def user_login(data: LoginRequest):
    result = login(data.username, data.password)
    

    if result.get("status") != "success":
        raise HTTPException(status_code=401, detail=result)

    user_data = result["data"]
    user_id = user_data["user_id"]

    token = create_passport(user_id)

    return {
        "status": "success",
        "token": token,
        "name": user_data["name"],
        "username": user_data["username"]
    }

@app.post("/register")
def register(data: RegisterRequest):
    result = create_account(data.username, data.password, data.name)

    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message", "Registration failed"))

    user_data = result["data"]
    user_id = user_data["user_id"]

    token = create_passport(user_id)

    return {
        "status": "success",
        "token": token,
        "name": user_data["name"],
        "username": user_data["username"]
    }


# --- PROTECTED PRODUCT ROUTES ---

@app.get("/products")
def view_products_api(user: dict = Depends(get_current_user)):
    return get_products(user["user_id"])

@app.post("/products")
def create_product(data: ProductCreate, user: dict = Depends(get_current_user)):
    return add_product(
        user["user_id"],
        data.product_name,
        data.mrp,
        data.stock,
        data.profit_margin
    )

@app.put("/products/update-stock")
def update_stock_api(data: StockUpdate, user: dict = Depends(get_current_user)):
    return update_stock(user["user_id"], data.product_id, data.change)

@app.put("/products/update-price")
def update_price_api(data: ProductPriceUpdate, user: dict = Depends(get_current_user)):
    return update_product_price(user["user_id"], data.product_id, data.new_mrp)

@app.delete("/products/{product_id}")
def remove_product(product_id: int, user: dict = Depends(get_current_user)):
    return delete_product(user["user_id"], product_id)

@app.put("/products/update-margin")
def update_margin_api(data: ProductMarginUpdate, user: dict = Depends(get_current_user)):
    return update_profit_margin(user["user_id"], data.product_id, data.new_margin)

#  PROTECTED SALES ROUTES

@app.post("/sales")
def create_sale(data: SaleCreate, user: dict = Depends(get_current_user)):
    return record_sale(user["user_id"], data.product_id, data.quantity)

@app.get("/sales/recent")
def recent_sales(user: dict = Depends(get_current_user)):

    return get_recent_sales(user["user_id"])

# --- PROTECTED ANALYTICS ROUTES ---

@app.get("/analytics/revenue")
def revenue(period: str=None,user: dict = Depends(get_current_user)):
    return analytics.revenue_summary(user["user_id"],period)

@app.get("/alerts/low-stock")
def low_stock(user: dict = Depends(get_current_user)):
    return get_low_stock_products(user["user_id"])