# Smart Inventory Manager (Web Version) 📦

A full-stack inventory management system built with **FastAPI**, **MySQL**, and **Vanilla JavaScript**.

This application allows shopkeepers to manage products, track sales, and monitor stock levels through a browser dashboard.

The backend is deployed on **Render**, and the database runs on **Aiven MySQL**.

---

# 🚀 Features

## Authentication System
- User registration with validation
- Secure login using JWT tokens
- Password hashing using bcrypt
- Token verification for protected routes

## Product Management
Full CRUD inventory system:

- Add product
- Edit MRP
- Edit profit margin
- Adjust stock
- Delete product
- Prevent duplicate product names per user

### Validations
- Product name validation
- MRP must be greater than 0
- Profit margin cannot exceed MRP
- Stock validation
- Input sanitization

---

# 🛒 Sales System

Each sale performs an **atomic transaction**:

1. Product is selected
2. Quantity is validated
3. Sale record is created
4. Product stock is updated
5. Both operations run in a single transaction

If any step fails → the transaction rolls back.

### Data stored per sale

- Product ID
- Quantity sold
- Total sale value
- Total profit
- Timestamp

---

# ⚠️ Low Stock Alert

Every time a user logs in:

- Products below stock threshold are checked
- An alert displays low-stock items
- Ordered from most critical to least critical

This helps shopkeepers restock before inventory runs out.

---

# 📊 Analytics (Planned Feature)

Analytics section is currently a placeholder.

Planned future analytics features:

- Revenue summary (3 / 6 / 12 months)
- Sales trend graphs
- Top products by profit
- Least selling products
- Inventory performance reports

---

# 🗄️ Database Design

## Users Table

| Column | Type | Description |
|------|------|-------------|
| userid | INT | Primary key |
| username | VARCHAR | Unique username |
| name | VARCHAR | Display name |
| password_hash | VARCHAR | Hashed password |
| created_at | TIMESTAMP | Account creation |

---

## Products Table

| Column | Type | Description |
|------|------|-------------|
| productid | INT | Primary key |
| user_id | INT | Foreign key → users |
| product_name | VARCHAR | Product name |
| mrp | DECIMAL | Selling price |
| stock | INT | Available quantity |
| profit_margin | DECIMAL | Profit per unit |

---

## Sales Table

| Column | Type | Description |
|------|------|-------------|
| saleid | INT | Primary key |
| user_id | INT | Foreign key → users |
| product_id | INT | Foreign key → products |
| quantity | INT | Units sold |
| total_sale | DECIMAL | Quantity × MRP |
| total_profit | DECIMAL | Quantity × margin |
| sale_time | TIMESTAMP | Sale timestamp |

---

# 🏗️ Architecture

The system follows a **layered architecture**:

```
Frontend (HTML + JavaScript)
        ↓
API Layer (FastAPI)
        ↓
Business Logic
        ↓
Database Layer (MySQL)
```

Each layer has a clear responsibility:

| Layer | Responsibility |
|------|----------------|
| Frontend | User interface, sends API requests, renders dashboard |
| API Layer | Handles HTTP requests and routes them to backend logic |
| Business Logic | Implements inventory rules, validation, and workflows |
| Database Layer | Stores users, products, and sales data in MySQL |

---

# 📁 Project Structure

| Folder/File | Description |
|-------------|-------------|
| `main.py` | FastAPI entry point that mounts frontend and exposes API routes |
| `auth/` | Handles login, registration, and JWT token logic |
| `database/` | MySQL connection and SQL query handlers |
| `inventory/` | Product and sales management logic |
| `analytics/` | Analytics queries and reporting logic |
| `frontend/` | All HTML, CSS, and JavaScript files |
| `requirements.txt` | Python dependencies |

---

# ⚙️ Setup

## Requirements

| Tool | Version |
|-----|--------|
| Python | 3.12+ |
| MySQL | 8+ |
| FastAPI | Latest |
| Uvicorn | Latest |

---

## Install Dependencies

```bash
pip install -r requirements.txt

# 🔐 Environment Variables

Create a `.env` file in the project root.

```env
DB_HOST=your_host
DB_PORT=your_port
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

SECRET_KEY=your_secret_key
ALGORITHM=HS256
```

---

# ▶️ Running the Application

Start the backend server:

```bash
uvicorn main:app --reload
```

Open the application in your browser:

```
http://127.0.0.1:8000
```

---

# 🌐 Deployment

| Component | Platform |
|----------|----------|
| Backend API | Render |
| Database | Aiven MySQL |
| Frontend | Served by FastAPI |


# 🌍 Live Demo

https://inventory-manager-fs9t.onrender.com

> **Note:**  
> The application backend is hosted on **Render's free tier**.  
> Free Render services automatically go to sleep after a period of inactivity.  
> When you open the link for the first time, the server may take **30–60 seconds to wake up** before the application loads.  
> After it wakes up, the application will respond normally.


---

# 🔮 Future Improvements

| Feature | Description |
|--------|-------------|
| Analytics Dashboard | Graphs for sales and revenue |
| Sales Reports | Time-based reports (daily / monthly) |
| Receipt Generation | Printable sales receipts |
| Pagination | Handle large product lists |
| Stock Refill System | Add stock to existing items |

---

# 👤 Author

**Ayush Tiwari**

GitHub:  
https://github.com/ayushtiwari-dev-coder