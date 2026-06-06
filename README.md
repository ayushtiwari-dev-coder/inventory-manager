---
title: Inventory-v3
sdk: docker
pinned: false
---

# 🏬 Multi-Tenant Inventory SaaS

A full-stack, multi-tenant inventory management system built with **FastAPI** (Python) on the backend and **React + Vite** on the frontend. Supports multiple isolated organizations (workspaces), role-based access control, real-time sales processing, and analytics — all secured by dual-scoped JWTs.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Authentication & Security](#-authentication--security)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Frontend Pages & Components](#-frontend-pages--components)
- [Analytics Engine](#-analytics-engine)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Key Design Decisions](#-key-design-decisions)

---

## 🌐 Overview

This system allows multiple independent businesses (organizations/workspaces) to manage their inventory, record sales, and monitor analytics — all from a single deployment. Each organization's data is fully isolated from all others at the database query level.

**Core capabilities:**

- 🔐 Invite-code-based multi-tenant onboarding (no open registration)
- 📦 Product catalog management with cost/selling price and profit margin tracking
- 🛒 Multi-item cart-based sales recording with atomic stock deduction
- 📊 Analytics — sales trends, top-profit products, least-sold products
- 👥 Employee management with role promotion/demotion
- 📋 Full organization-scoped audit log of every sensitive action
- ⚠️ Low-stock alerts with configurable thresholds

---

## 🛠 Tech Stack

### Backend

| Layer | Technology |
|---|---|
| API Framework | FastAPI (Python) |
| Database | MySQL (via `mysql-connector-python` with connection pooling) |
| ORM / Query Style | Raw SQL with parameterized queries |
| Authentication | JWT (`PyJWT`) — dual-scope tokens |
| Password Hashing | `bcrypt` |
| Config Management | `python-dotenv` |
| Validation | Pydantic v2 (`BaseModel`, `field_validator`) |

### Frontend

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v6 |
| Server State | TanStack Query (React Query v5) |
| Charts | Custom SVG (native, no charting library) |
| HTTP Client | Custom `apiClient` (fetch-based) |

---

## 📁 Project Structure

```
├── main.py                          # FastAPI app entrypoint — all route definitions
├── test_db.py                       # Quick DB diagnostic script
│
├── auth/
│   └── login_logic.py               # Account creation, login, workspace activation
│
├── analytics/
│   └── report.py                    # Analytics queries (trends, top/least products, revenue)
│
├── database/
│   ├── connection.py                # MySQL connection pool (size: 10) with SSL
│   ├── org_manager.py               # Organization CRUD, member management, audit logs
│   └── sql_handler.py               # Core ORM-style classes: User, Product, Sale, DatabaseHelper
│
├── inventory/
│   ├── product_manager.py           # Product business logic & validation layer
│   └── sales_manager.py             # Sales recording delegation layer
│
├── security/
│   ├── auth_deps.py                 # JWT creation, validation, FastAPI Depends gatekeepers
│   └── hashing.py                   # bcrypt password hashing & verification
│
├── utils/
│   └── validation.py                # Shared input validators (product name rules, etc.)
│
└── frontend_react/
    ├── index.html                   # HTML entrypoint
    ├── vite.config.js               # Vite + Tailwind + React plugin config
    ├── src/
    │   ├── App.jsx                  # Route tree with protected route guards
    │   ├── main.jsx                 # React root with QueryClientProvider
    │   ├── index.css                # Global Tailwind base + body styles (deep navy theme)
    │   ├── components/
    │   │   ├── AuthModal.jsx        # Login/register modal
    │   │   ├── CartModal.jsx        # Multi-item sales cart UI
    │   │   ├── Layout.jsx           # App shell with sidebar
    │   │   ├── MobileBottomBar.jsx  # Mobile navigation bar
    │   │   ├── ProductFormModal.jsx # Add/edit product form
    │   │   ├── Sidebar.jsx          # Desktop navigation sidebar
    │   │   ├── Toast.jsx            # Toast notification component
    │   │   └── WorkspacePicker.jsx  # Organization selection card UI
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── WorkspacePage.jsx    # Workspace select/create/join
    │   │   ├── ProductsPage.jsx     # Full product management UI
    │   │   ├── SalesPage.jsx        # Sales recording + history
    │   │   ├── AnalyticsPage.jsx    # Charts and KPIs
    │   │   ├── EmployeesPage.jsx    # Team member management
    │   │   ├── LogsPage.jsx         # Audit log viewer
    │   │   └── ProfilePage.jsx      # User profile/settings
    │   ├── queries/                 # TanStack Query hooks (per domain)
    │   ├── services/                # API service modules (per domain)
    │   ├── context/
    │   │   └── ToastContext.jsx     # Global toast notification context
    │   ├── hooks/
    │   │   └── useApi.js            # Generic API hook wrapper
    │   ├── lib/
    │   │   └── queryClient.js       # TanStack QueryClient singleton
    │   └── utils/
    │       ├── authHelpers.js       # Token storage helpers
    │       ├── formHelpers.js       # Form state helpers
    │       ├── keyHandlers.js       # Keyboard event handlers
    │       └── validators.js        # Client-side validation
    └── dist/                        # Production build (served by FastAPI StaticFiles)
```

---

## 🏗 Architecture

The application follows a layered architecture where each layer has a single responsibility:

```
HTTP Request
    │
    ▼
┌─────────────────────────────────┐
│  main.py  (Route Definitions)   │  ← Pydantic schema validation, HTTP error mapping
└────────────┬────────────────────┘
             │
    ┌────────▼────────────────┐
    │  Security Layer         │  ← JWT decode, role check (RequireRole), org membership verify
    │  security/auth_deps.py  │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │  Business Logic Layer   │  ← input rules, business constraints
    │  auth/login_logic.py    │
    │  inventory/*_manager.py │
    │  analytics/report.py    │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │  Data Access Layer      │  ← Raw SQL, connection pool, audit logging
    │  database/sql_handler.py│
    │  database/org_manager.py│
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │  MySQL Database         │
    └─────────────────────────┘
```

---

## 🔐 Authentication & Security

### Dual-Scope JWT System

The system uses **two separate JWT tokens** to model a two-phase login:

| Token | When Issued | Payload | Used For |
|---|---|---|---|
| `global_token` | After login / registration | `user_id`, `username` | Workspace selection, org creation/join |
| `org_token` | After workspace selection | `user_id`, `username`, `org_id`, `role` | All inventory, sales, analytics operations |

This prevents a freshly logged-in user from accidentally or maliciously accessing org-scoped endpoints before selecting a workspace.

### Token Lifecycle

```
Register / Login
      │
      ▼
  global_token issued (no org_id, no role)
      │
      ▼
  POST /auth/workspace/select  (presents global_token)
      │
      ▼
  org_token issued (includes org_id + role)
      │
      ▼
  All protected routes use org_token
```

### Security Features

- **bcrypt** password hashing with per-password salts (`security/hashing.py`)
- **Brute-force protection**: 3 failed login attempts triggers a 5-minute account lockout (`auth/login_logic.py`)
- **Master Entry Code**: New account registration requires a server-side `MASTER_ENTRY_CODE` env var — prevents open public registration
- **Live membership re-validation**: Every org-scoped request re-queries the database to confirm the user is still an active member of that organization (token alone is not enough)
- **JWT expiry**: 5 days (`timedelta(days=5)`)
- **TanStack Query cache wipe on workspace switch** (`queryClient.clear()`) to prevent cross-tenant data leakage in the browser

---

## 👤 Role-Based Access Control (RBAC)

Three roles exist within each organization:

| Role | Permissions |
|---|---|
| `owner` | Full access: products, sales, analytics, members, role changes, audit logs |
| `manager` | Products, sales, analytics, view/remove members, audit logs — cannot change roles |
| `employee` | View products, record sales, view low-stock alerts only |

RBAC is enforced at the route level via the `RequireRole` FastAPI dependency:

```python
@app.get("/products")
def view_products_api(user: dict = Depends(RequireRole(["owner", "manager", "employee"]))):
    ...

@app.put("/org/members/role")
def change_role(data: ChangeRoleRequest, user: dict = Depends(RequireRole(["owner"]))):
    ...
```

### Workspace Join Codes

Each organization is issued two unique 6-character alphanumeric codes on creation:

- `manager_join_code` — grants `manager` role on join
- `employee_join_code` — grants `employee` role on join

These codes are **masked as NULL** in the org profile API response when requested by an employee.

---

## 🗄 Database Schema

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| `user_id` | INT PK | Auto-increment |
| `username` | VARCHAR | Unique, lowercase |
| `password_hash` | VARCHAR | bcrypt hash |
| `name` | VARCHAR | Display name |
| `user_gmail` | VARCHAR | Optional |
| `failed_attempts` | INT | Brute-force counter |
| `lock_until` | BIGINT | Unix timestamp of lockout expiry |
| `is_active` | TINYINT | Soft delete flag |

#### `organizations`
| Column | Type | Notes |
|---|---|---|
| `org_id` | INT PK | Auto-increment |
| `org_name` | VARCHAR | Alphanumeric + spaces/dashes, max 40 chars |
| `owner_id` | INT FK | References `users` |
| `owner_gmail` | VARCHAR | Optional |
| `manager_join_code` | VARCHAR(6) | Unique invite code |
| `employee_join_code` | VARCHAR(6) | Unique invite code |
| `is_active` | TINYINT | Soft delete flag |
| `deleted_at` | TIMESTAMP | Set on soft delete |
| `created_at` | TIMESTAMP | Auto |

#### `user_organizations`
| Column | Type | Notes |
|---|---|---|
| `user_id` | INT FK | |
| `org_id` | INT FK | |
| `role` | ENUM | `owner`, `manager`, `employee` |
| `is_active` | TINYINT | Soft remove flag |
| `created_at` | TIMESTAMP | |

#### `products`
| Column | Type | Notes |
|---|---|---|
| `product_id` | INT PK | |
| `org_id` | INT FK | Tenant isolation key |
| `product_name` | VARCHAR | Unique per org, max 50 chars |
| `mrp` | DECIMAL | Selling price |
| `cost_price` | DECIMAL | Purchase/cost price |
| `profit_margin` | DECIMAL | `mrp - cost_price`, auto-computed |
| `stock` | INT | Current stock units |
| `is_active` | TINYINT | Soft delete flag |
| `deleted_id` | INT | Stores original product_id on delete |
| `deleted_at` | TIMESTAMP | |

#### `sales`
| Column | Type | Notes |
|---|---|---|
| `sale_id` | INT PK | Parent invoice record |
| `org_id` | INT FK | |
| `user_id` | INT FK | Who recorded the sale |
| `total_sale` | DECIMAL | Sum of all line item revenues |
| `total_profit` | DECIMAL | Sum of all line item profits |
| `sale_time` | TIMESTAMP | Auto |
| `is_active` | TINYINT | |

#### `sale_items`
| Column | Type | Notes |
|---|---|---|
| `item_id` | INT PK | |
| `sale_id` | INT FK | Links to parent sale |
| `product_id` | INT FK | |
| `quantity` | INT | |
| `item_sale` | DECIMAL | `mrp × quantity` |
| `item_profit` | DECIMAL | `profit_margin × quantity` |

#### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| `log_id` | INT PK | |
| `org_id` | INT FK | |
| `user_id` | INT FK | Actor |
| `username` | VARCHAR | Denormalized for display |
| `action_type` | VARCHAR | e.g. `ADD_PRODUCT`, `RECORD_SALE` |
| `details` | JSON | Action-specific context |
| `created_at` | TIMESTAMP | |

#### `permissions`
| Column | Type | Notes |
|---|---|---|
| `permission_key` | VARCHAR | e.g. `edit_inventory` |
| `description` | VARCHAR | Human-readable |

---

## 📡 API Reference

### Authentication (No token required)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create a new user account (requires `master_code`) |
| `POST` | `/login` | Authenticate and receive a `global_token` |

### Workspace Management (Global token required)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/workspace/select` | Select an org; receive an `org_token` |
| `POST` | `/org/create` | Create a new organization |
| `POST` | `/org/join` | Join an organization via invite code |
| `GET` | `/org/profile` | Get current organization profile & join codes |

### Inventory (Org token required)

| Method | Endpoint | Roles |
|---|---|---|
| `GET` | `/products` | owner, manager, employee |
| `POST` | `/products` | owner, manager |
| `PUT` | `/products/update` | owner, manager |
| `DELETE` | `/products/{product_id}` | owner, manager |
| `GET` | `/alerts/low-stock` | owner, manager, employee |

### Sales (Org token required)

| Method | Endpoint | Roles |
|---|---|---|
| `POST` | `/sales` | owner, manager, employee |
| `GET` | `/sales` | owner, manager, employee |

### Members (Org token required)

| Method | Endpoint | Roles |
|---|---|---|
| `GET` | `/org/members` | owner, manager |
| `DELETE` | `/org/members/{user_id}` | owner, manager |
| `PUT` | `/org/members/role` | owner only |

### Analytics (Org token required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/top-profitable` | Top 10 products by total profit |
| `GET` | `/analytics/least-sold` | Bottom 10 products by quantity sold |
| `GET` | `/analytics/trend?months=N` | Daily revenue + profit for last N months |

### Logs (Org token required)

| Method | Endpoint | Roles |
|---|---|---|
| `GET` | `/api/logs?limit=N` | owner, manager |

---

## 🖥 Frontend Pages & Components

### Route Guards

Two levels of protection wrap the route tree in `App.jsx`:

- **`ProtectedRoute`** — checks for `global_token` in `localStorage`; redirects to `/login` if absent
- **`WorkspaceRequiredRoute`** — checks for `org_token` in `localStorage`; redirects to `/workspaces` if absent

```
/login                  → LoginPage (public)
/register               → RegisterPage (public)
/workspaces             → WorkspacePage (global_token required)
/products               → ProductsPage (org_token required)
/sales                  → SalesPage (org_token required)
/analytics              → AnalyticsPage (org_token required)
/employees              → EmployeesPage (org_token required)
/profile                → ProfilePage (org_token required)
/logs                   → LogsPage (org_token required)
```

### Key Components

#### `WorkspacePicker.jsx`
Displays the user's joined organizations as selectable cards. Also allows creating a new org or joining via a 6-character code.

#### `CartModal.jsx`
Multi-item sales cart. Users search and add products, set quantities, and submit the entire order atomically.

#### `ProductFormModal.jsx`
Add or edit a product. Fields: name, selling price, cost price, and stock quantity. Includes inline validation.

#### `AnalyticsPage.jsx`
Renders a **custom SVG line chart** (no third-party chart library) showing daily revenue and profit over a configurable window (3, 6, 12, or 24 months). Also displays top-profitable and least-sold product tables.

#### `LogsPage.jsx`
Paginated view of the organization audit trail, showing action type, actor username, timestamp, and JSON details.

#### `Toast.jsx` + `ToastContext.jsx`
Global toast notification system via React Context. Any component can trigger a notification via the `useToast()` hook.

### Service Layer (`src/services/`)

Each domain has its own API service module that wraps the shared `apiClient`:

| File | Domain |
|---|---|
| `authApi.js` | Login, register |
| `productApi.js` | Product CRUD |
| `salesApi.js` | Record + fetch sales |
| `analyticsApi.js` | Analytics queries |
| `employeeApi.js` | Member management |
| `logsService.js` | Audit log fetch |
| `workspaceApi.js` | Workspace select/create/join |

### Query Layer (`src/queries/`)

TanStack Query hooks wrap each service call, providing caching, background refetching, and optimistic updates:

| File | Hooks |
|---|---|
| `productQueries.js` | `useProducts` |
| `productMutations.js` | `useAddProduct`, `useUpdateProduct`, `useDeleteProduct` |
| `salesQueries.js` | `useSales` |
| `salesMutations.js` | `useRecordSale` |
| `analyticsQueries.js` | `useSalesTrend`, `useTopProfitable`, `useLeastSold` |
| `employeeQueries.js` | `useOrgMembers`, `useRemoveMember`, `useChangeRole` |
| `useLogsQuery.js` | `useLogsQuery` |
| `workspaceQueries.js` | `useUserWorkspaces`, `useSelectWorkspace` |

---

## 📊 Analytics Engine

`analytics/report.py` provides four static methods:

### `top_products_by_profit(org_id, limit=10)`
Aggregates `SUM(item_profit)` and `SUM(quantity)` from `sale_items` joined to active products, ordered descending by total profit.

### `least_sold_products(org_id, limit=10)`
Same join, but ordered ascending by total quantity sold — surfaces slow-moving inventory.

### `sales_trend(org_id, months=4)`
Groups `sales` records by `DATE(sale_time)` for the last N months. Returns parallel arrays (`dates`, `revenue`, `profit`) ready for SVG chart rendering.

### `revenue_summary(org_id, period=None)`
Aggregates total transactions, revenue, and profit. Supports `daily`, `weekly`, `monthly`, `3monthly`, and `yearly` filter periods.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# JWT
SECRET_KEY=your-super-secret-jwt-key

# App Access Control
MASTER_ENTRY_CODE=your-private-registration-code
```

> **Note:** The database connection uses SSL with a `ca.pem` certificate file expected in the project root (`ssl_ca="ca.pem"`). For local development without SSL, set `ssl_disabled=True` in `database/connection.py`.

---

## 🚀 Getting Started

### 🤗 Deployed on Hugging Face Spaces (Docker SDK)

This app is hosted on **Hugging Face Spaces** using the **Docker** SDK. The Space automatically builds and runs the container on every push — no manual server setup required.

---

### 🐳 How It Works on Hugging Face

Hugging Face Spaces with `sdk: docker` look for a `Dockerfile` in the repo root and build/run it automatically. The FastAPI backend serves the pre-built React frontend as static files, so the entire app runs as a **single container on a single port**.

```
Browser → Hugging Face Space URL
             │
             ▼
         Docker Container
             │
             ▼
     uvicorn main:app (port 7860)
             │
        ┌────┴────────────────┐
        │                     │
   /api/* routes         / (static)
   FastAPI backend       React frontend
                         (dist/ folder)
```

> **Port 7860** is the default port Hugging Face exposes for Docker Spaces. Make sure your `Dockerfile` exposes and binds to `7860`.

---

###  Setting Environment Variables on Hugging Face

> 鈿狅笍 Never commit your `.env` file to the repo. Use Hugging Face Space secrets instead.

**Steps to add secrets:**
1. Open your Space on `huggingface.co`
2. Click the **Settings** tab
3. Scroll down to **Variables and Secrets**
4. Click **New Secret** and add each one listed below

```env
DB_HOST        = your-mysql-host
DB_PORT        = 3306
DB_USER        = your-database-username
DB_PASSWORD    = your-database-password
DB_NAME        = your-database-name
SECRET_KEY     = any-long-random-string-for-jwt
MASTER_ENTRY_CODE = your-private-registration-code
```

> Each secret is injected automatically as an environment variable when your container starts. Your `os.getenv()` calls in `database/connection.py` and `security/auth_deps.py` will pick them up with zero extra configuration.

---

###  Database Initialization

On first run, tables are created automatically via:

```python
# In main.py (runs on startup)
Database.create_tables()
```

This is called at module load time, so the first request to any endpoint will trigger table creation if they don't exist yet.

---

###  Required Dockerfile

Your `Dockerfile` at the repo root should look like this:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy full project
COPY . .

# Expose HuggingFace default port
EXPOSE 7860

# Start FastAPI on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

---

###  requirements.txt

```
fastapi
uvicorn
mysql-connector-python
PyJWT
bcrypt
python-dotenv
pydantic
```

---

###  Local Development (Optional)

If you want to run locally before pushing to Hugging Face:

```bash
# 1. Clone your Space repo
git clone https://huggingface.co/spaces/<your-username>/Inventory-v3
cd Inventory-v3

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env with your credentials
cp .env.example .env
# Fill in DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, SECRET_KEY, MASTER_ENTRY_CODE

# 5. Run the app
uvicorn main:app --reload --port 7860
```

> The React frontend (`frontend_react/dist/`) is already pre-built and committed to the repo, so you don't need Node.js to run the app locally.

If you modify the frontend source and need to rebuild:

```bash
cd frontend_react
npm install
npm run build
# Commit the updated dist/ folder
```

---

## Key Design Decisions

### Multi-Tenancy via `org_id` Column Filtering
Every table that holds tenant-specific data (`products`, `sales`, `sale_items`, `audit_logs`) includes an `org_id` foreign key. All queries are unconditionally scoped with `WHERE org_id = %s`, making cross-tenant data leakage impossible at the SQL level.

### Atomic Sale Processing with `FOR UPDATE` Locking
`Sale.record_sale()` uses a single-query batch fetch with `FOR UPDATE` row-level locks before any stock deduction. This prevents race conditions when two employees process the same product simultaneously.

### In-Memory Hash Map for Sale Calculations
After the locked batch fetch, all per-item calculations (total sale value, profit, stock validation) are performed in Python dictionaries before any further database writes. This reduces round-trips to a fixed 3 queries per sale transaction regardless of cart size.

### Soft Deletes Everywhere
Products, organizations, and user memberships are never hard-deleted. The `is_active = 0` flag pattern preserves historical sale records and audit integrity while hiding records from active queries.

### Audit Log Written Inside Transactions
`DatabaseHelper.log_action()` takes an active `cursor` rather than opening its own connection. This ensures the audit log entry and the business operation (e.g. stock update, member removal) are committed atomically or both rolled back on failure.

### Two-Token Auth Flow
Separating global and workspace-scoped tokens allows the system to support multi-workspace users cleanly. A user belonging to 3 organizations holds one `global_token` and switches between `org_token`s without re-authenticating.

### React Query Cache Cleared on Workspace Switch
When `useSelectWorkspace` succeeds, it calls `queryClient.clear()` to wipe all cached query data. This prevents a user switching from Org A to Org B from briefly seeing Org A's product data.