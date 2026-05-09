import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --- LOGIC IMPORTS ---
from database.sql_handler import Database,User
from auth.login_logic import create_account, login
from inventory.product_manager import (
    get_products, add_product, delete_product,update_product_full
)
from inventory.sales_manager import record_sale,get_recent_sales
from analytics.report import analytics
from controller_inventory import get_low_stock_products

# --- INITIALIZATION ---
load_dotenv()
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://inventory-manager-fs9t.onrender.com"
    ],
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
    items: list[SaleItem]

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

# profile routes

@app.get("/profile")
def profile(user: dict = Depends(get_current_user)):
    result=User.get_user_by_id(user["user_id"])
    if not result:
        return {"status":"error"}
    return{
        "status":"success",
        "data":{
            "username":result["username"],
            "name":result["name"]
        }
    }

@app.get("/products")
def view_products_api(user: dict = Depends(get_current_user)):
    return get_products(user["user_id"])

@app.post("/products")
def create_product(data: ProductCreate, user: dict = Depends(get_current_user)):
    return add_product(
        user["user_id"],
        data.product_name,
        data.selling_price,
        data.stock,
        data.cost_price
    )

@app.put("/products/update")
def update_product_api(data: ProductUpdate, user: dict = Depends(get_current_user)):
    return update_product_full(
        user["user_id"],
        data.product_id,
        data.selling_price,
        data.cost_price,
        data.stock_change
    )

@app.delete("/products/{product_id}")
def remove_product(product_id: int, user: dict = Depends(get_current_user)):
    return delete_product(user["user_id"], product_id)


#  PROTECTED SALES ROUTES

@app.post("/sales")
def create_sale(data: SaleCreate, user: dict = Depends(get_current_user)):

    items = [
        {
            "product_id": item.product_id,
            "quantity": item.quantity
        }
        for item in data.items
    ]

    return record_sale(user["user_id"], items)

@app.get("/sales/recent")
def recent_sales(user: dict = Depends(get_current_user)):

    return get_recent_sales(user["user_id"])

# --- PROTECTED ANALYTICS ROUTES ---

@app.get("/analytics/sales-trend")
def sales_trend(months: int = 4, user: dict = Depends(get_current_user)):
    return analytics.sales_trend(user["user_id"], months)

@app.get("/analytics/top-products")
def top_products(limit: int = 10, user: dict = Depends(get_current_user)):
    return analytics.top_products_by_profit(user["user_id"], limit)

@app.get("/analytics/least-products")
def least_products(limit: int = 10, user: dict = Depends(get_current_user)):
    return analytics.least_sold_products(user["user_id"], limit)

@app.get("/analytics/revenue")
def revenue(period: str=None,user: dict = Depends(get_current_user)):
    return analytics.revenue_summary(user["user_id"],period)

@app.get("/alerts/low-stock")
def low_stock(user: dict = Depends(get_current_user)):
    return get_low_stock_products(user["user_id"])


app.mount("/",StaticFiles(directory="frontend",html=True),name="frontend")