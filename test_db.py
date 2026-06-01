import mysql.connector
from database.connection import get_connection  # Reuses your actual .env connection logic

try:
    # 1. Grab a connection from your existing pool/setup
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)  # Using dictionary=True to match your style
    
    # 2. Run the row count checks
    cursor.execute("SELECT COUNT(*) AS total_orgs FROM organizations;")
    org_result = cursor.fetchone()
    
    cursor.execute("SELECT COUNT(*) AS total_products FROM products;")
    prod_result = cursor.fetchone()
    
    print("\n=== DATABASE DIAGNOSTIC ===")
    print(f"Actual rows in 'organizations': {org_result['total_orgs']}")
    print(f"Actual rows in 'products':      {prod_result['total_products']}")
    print("============================\n")

except mysql.connector.Error as err:
    print(f"Database Error: {err}")

finally:
    # 3. Clean up and return connection to pool
    if 'cursor' in locals():
        cursor.close()
    if 'connection' in locals() and connection.is_connected():
        connection.close()