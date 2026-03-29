# Inventory Management System

A Python-based Inventory Management System that allows users to manage products, sales, and user accounts. This system supports features such as account creation, login, product management (view, add, update, delete), and sales tracking with multiple user support.

## Features

- **Account Management**:
  - User Registration
  - Login System with password hashing
  - Account Lock after multiple failed login attempts

- **Product Management**:
  - Add new products
  - View products in inventory
  - Update product details (price, stock, profit margin)
  - Delete products

- **Sales Management**:
  - Record sales with quantity and total sale amount
  - Automatically update product stock when a sale is made

- **Multi-User Support**:
  - Different users can manage products and sales independently

- **Database**:
  - MySQL-based database to store user, product, and sales data.
  - Uses Foreign Key relationships to link products and sales to users.

## Tech Stack

- Python 3.12
- MySQL
- Command Line Interface (CLI)

## Getting Started

### Prerequisites

Make sure the following are installed on your machine:

- Python 3.12
- MySQL

### Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/inventory-management.git
    cd inventory-management
    ```

2. **Install the required Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3. **Set up MySQL**:
    - Create a new database `inventory_manager`.
    - Run the following SQL script to create the necessary tables:
      ```sql
      CREATE DATABASE IF NOT EXISTS inventory_manager;

      USE inventory_manager;

      CREATE TABLE IF NOT EXISTS users (
          user_id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(50),
          lock_until INT DEFAULT 0,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
          product_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_name VARCHAR(50) NOT NULL,
          mrp DECIMAL(10,2) NOT NULL,
          stock INT NOT NULL,
          profit_margin DECIMAL(5,2) NOT NULL,
          UNIQUE(user_id, product_name),
          INDEX(user_id, product_id),
          FOREIGN KEY(user_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS sales (
          sale_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          total_sale DECIMAL(10,2) NOT NULL,
          sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(user_id),
          FOREIGN KEY(product_id) REFERENCES products(product_id),
          INDEX(product_id)
      );
      ```

4. **Run the program**:
    - After setting up your database, you can now run the program by executing `main.py`:
      ```bash
      python main.py
      ```

## Usage

### **Account Management**:
1. **Create an account**: Users can register by providing a username and password.
2. **Login**: Users can log in to access product and sales management features.
3. **Account Locking**: Accounts are locked for 5 minutes after 3 failed login attempts.

### **Product Management**:
- Add new products with details such as product name, MRP (Maximum Retail Price), profit margin, and stock.
- Update product details like price or profit margin.
- Delete products from the inventory.

### **Sales Management**:
- Record sales transactions, which update the stock and calculate the total sale.
  
## Future Improvements
- Implement **API support** for broader access (e.g., for mobile apps).
- Add **role-based access control (RBAC)** to manage different levels of access (Admin/Worker).
- Implement **session management** to persist login state.

## License

This project is licensed under the MIT License.

---

### Contact

- **Author**: Ayush Tiwari 
- **Email**: ayushtiwari24512@gmail.com

