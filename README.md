# Smart Inventory Manager 📦

A modular Python CLI application designed to help shopkeepers manage products, track sales, and analyze business performance. Built with MySQL for persistent storage, OOP architecture, and a clean separation of concerns across modules.

## ⚠️ How to Run

1. Run the following command:
    ```bash
    python main.py
    ```

2. Ensure MySQL is running and your `database/connection.py` is configured with your credentials before starting.

## 📁 Project Structure

← Entry point 
├── auth/ 
│   ├── login_logic.py               ← Account creation, login, lockout 
│   └── session_manager.py           ← Session persistence via pickle 
├── database/ 
│   ├── connection.py                ← MySQL connection (gitignored) 
│   └── sql_handler.py               ← All database classes and queries 
├── inventory/ 
│   ├── product_manager.py           ← Product CRUD flow 
│   └── sales_manager.py             ← Sales recording flow 
├── analytics/ 
│   ├── reports.py                   ← Analytics query class 
│   └── analytics_controller.py     ← Analytics display and menu 
├── utils/ 
│   └── validation.py                ← Input validation helpers 
└── controller_inventory.py          ← Main inventory dashboard

## 🔐 Authentication System

- **Register** with username and password validation.
- Passwords hashed with SHA-256 before storage.
- 3 wrong attempts trigger a 5-minute account lockout.
- **Session** saved after login — auto-login on next launch via pickle.
- **Logout** clears session file.

## 👤 Session Management

- Session stored locally after successful login.
- On program start — session is checked first.
- If valid session exists — user goes directly to dashboard.
- **Logout** clears the session file completely.

## 📦 Product Management

Full product CRUD system with validation at every step:

- **Add product** — name, MRP, profit margin, stock quantity
- **View all products** — alphabetical order
- **Update MRP or profit margin** per product
- **Delete product** with confirmation prompt — cascades to sales history
- **Duplicate product name** prevention per user

### Validations:

- Profit margin cannot exceed or equal MRP.
- MRP must be greater than zero.
- Stock cannot be negative.
- Product name length and character restrictions.

## 🛒 Sales Recording

Every sale is recorded as an atomic database transaction.

### Process:

1. Display current product list.
2. User selects product ID and quantity.
3. System validates stock availability.
4. Sale is inserted into sales table.
5. Stock is reduced in products table.
6. Both operations happen in a single transaction — if either fails, both roll back.

### Data recorded per sale:

- Product reference
- Quantity sold
- Total sale value
- Total profit
- Timestamp

## ⚠️ Low Stock Alert

- Shown automatically every time the user logs in.
- Displays all products with stock below threshold (default: 40 units).
- Ordered from most critical (lowest stock) first.
- Helps shopkeeper prioritize restocking before starting work.

## 📊 Analytics System

Separate analytics module with clean separation — query logic in `reports.py`, display logic in `analytics_controller.py`.

### Analytics Features:

- **Stock Overview**: All products sorted by current stock — highest to lowest.
- **Top Products by Profit**: JOIN query across sales and products tables, groups all sales per product, shows total quantity sold and total profit per product. Top 10 products ranked by profit generated.

## 🗄️ Database Design

### Tables:

#### Users:
- `userid`: INT AUTOINCREMENT | Primary key
- `username`: VARCHAR(50) | Unique
- `name`: VARCHAR(50) | Display name
- `password_hash`: VARCHAR(255) | SHA-256 hashed
- `lock_until`: INT | Unix timestamp for lockout
- `created_at`: TIMESTAMP | Auto set

#### Products:
- `productid`: INT AUTOINCREMENT | Primary key
- `user_id`: INT | Foreign key → users
- `product_name`: VARCHAR(50) | Unique per user
- `mrp`: DECIMAL(10,2) | Selling price
- `stock`: INT | Current quantity
- `profit_margin`: DECIMAL(5,2) | Profit per unit

#### Sales:
- `saleid`: INT AUTOINCREMENT | Primary key
- `user_id`: INT | Foreign key → users
- `product_id`: INT | Foreign key → products, CASCADE DELETE
- `quantity`: INT | Units sold
- `total_sale`: DECIMAL(10,2) | quantity × MRP
- `totalprofit`: DECIMAL(10,2) | quantity × profitmargin
- `sale_time`: TIMESTAMP | Auto set

## 🏗️ Architecture Decisions

- **Why MySQL over JSON**: JSON file storage breaks under concurrent access and has no query capability. MySQL handles multiple users, supports complex queries, and enforces data integrity through foreign keys.
- **Why atomic transactions in `record_sale`**: A sale involves two operations — inserting a sales record and reducing stock. If either fails, both must roll back. Separate database calls cannot guarantee this. A single transaction with `FOR UPDATE` row locking ensures consistency.
- **Why cascade delete on sales**: Deleting a product with sales history would leave orphaned records. `ON DELETE CASCADE` removes related sales automatically, maintaining referential integrity.
- **Why DatabaseHelper abstraction**: Most queries follow the same pattern — connect, execute, commit or fetch, close. `DatabaseHelper.execute_query` handles this once. Individual class methods focus on query logic only.
- **Why separate analytics module**: Analytics queries are reporting logic, not CRUD logic. Keeping them in `analytics/reports.py` means `sqlhandler.py` stays focused on data operations. Display logic stays in `analyticscontroller.py`.

## 🗂️ Module Responsibilities

- `main.py`: Entry point, session check, login menu
- `auth/login_logic.py`: Account creation, login, lockout logic
- `auth/session_manager.py`: Save, load, clear session
- `database/sql_handler.py`: All database classes — User, Product, Sale, Database
- `inventory/product_manager.py`: Product CRUD user flows
- `inventory/sales_manager.py`: Sale recording user flow
- `analytics/reports.py`: Analytics query class, returns data only
- `analytics/analytics_controller.py`: Analytics display, menus, formatting
- `controller_inventory.py`: Main dashboard, low stock alert, routing

## ⚙️ Setup

### Requirements:

- Python 3.12+
- MySQL Server
- `mysql-connector-python`
- `matplotlib`
- `pandas`

### Install dependencies:
```bash
pip install mysql-connector-python matplotlib pandas


## Database setup:

1. **Create a MySQL database:**
    ```sql
    CREATE DATABASE inventory_manager;
    ```

2. **Configure connection: Create `database/connection.py`:**
    ```python
    import mysql.connector

    def get_connection():
        return mysql.connector.connect(
            host="localhost",
            user="your_username",
            password="your_password",
            database="inventory_manager"
        )
    ```
   Tables are created automatically on first run.

## 🚀 Future Plans

- **Matplotlib graphs** — daily sales trend, profit distribution, product popularity
- **Time-based analytics** — daily, weekly, monthly reports
- **Stock replenishment feature** — add stock to existing products
- **FastAPI wrapper** — expose system as REST API
- **Cloud MySQL** — move database to cloud for 24/7 access
- **Deployment** — host on Railway or Render

## 👤 Author

- **Ayush Tiwari**
- [GitHub](https://github.com/ayushtiwari-dev-coder)

## 📄 License

MIT License



