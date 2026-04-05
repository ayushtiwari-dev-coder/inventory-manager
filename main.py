from fastapi import FastAPI
from pydantic import BaseModel

from database.sql_handler import Database
from auth.login_logic import create_account, login

from inventory.product_manager import (
    get_products,
    add_product,
    update_product_price,
    update_profit_margin,
    update_stock,
    delete_product
)

from inventory.sales_manager import record_sale
from analytics.report import analytics
from controller_inventory import get_low_stock_products


app = FastAPI()

Database.create_tables()


# Request Models

class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str


class ProductCreate(BaseModel):
    user_id: int
    product_name: str
    mrp: float
    stock: int
    profit_margin: float


class ProductPriceUpdate(BaseModel):
    user_id: int
    product_id: int
    new_mrp: float


class ProductMarginUpdate(BaseModel):
    user_id: int
    product_id: int
    new_margin: float


class StockUpdate(BaseModel):
    user_id: int
    product_id: int
    change: int


class SaleCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: int


# Auth

@app.post("/register")
def register(data: RegisterRequest):
    return create_account(
        data.username,
        data.password,
        data.name
    )


@app.post("/login")
def user_login(data: LoginRequest):
    return login(data.username, data.password)


# Products


@app.get("/products/{user_id}")
def view_products_api(user_id: int):
    return get_products(user_id)


@app.post("/products")
def create_product(data: ProductCreate):
    return add_product(
        data.user_id,
        data.product_name,
        data.mrp,
        data.stock,
        data.profit_margin
    )


@app.put("/products/update-price")
def update_price(data: ProductPriceUpdate):
    return update_product_price(
        data.user_id,
        data.product_id,
        data.new_mrp
    )


@app.put("/products/update-margin")
def update_margin(data: ProductMarginUpdate):
    return update_profit_margin(
        data.user_id,
        data.product_id,
        data.new_margin
        
    )


@app.put("/products/update-stock")
def update_stock_api(data: StockUpdate):
    return update_stock(
        data.user_id,
        data.product_id,
        data.change
    )


@app.delete("/products/{user_id}/{product_id}")
def remove_product(user_id: int, product_id: int):
    return delete_product(user_id, product_id)


# Sales

@app.post("/sales")
def create_sale(data: SaleCreate):
    return record_sale(
        data.user_id,
        data.product_id,
        data.quantity
    )


# Analytics

@app.get("/analytics/stock/{user_id}")
def stock_overview(user_id: int):
    return analytics.stock_overview(user_id)


@app.get("/analytics/top-products/{user_id}")
def top_products(user_id: int):
    return analytics.top_products_by_profit(user_id)


@app.get("/analytics/least-products/{user_id}")
def least_products(user_id: int):
    return analytics.least_sold_products(user_id)


@app.get("/analytics/revenue/{user_id}")
def revenue(user_id: int):
    return analytics.revenue_summary(user_id)


@app.get("/analytics/trend/{user_id}")
def sales_trend(user_id: int):
    return analytics.sales_trend(user_id)


# ----------------------
# Alerts
# ----------------------

@app.get("/alerts/low-stock/{user_id}")
def low_stock(user_id: int):
    return get_low_stock_products(user_id)