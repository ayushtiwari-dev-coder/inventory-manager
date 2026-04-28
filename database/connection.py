import os
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

connection_pool = pooling.MySQLConnectionPool(
    pool_name="inventory_pool",
    pool_size=10,
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    ssl_ca="ca.pem",
    ssl_verify_cert=True
)

def get_connection():
    return connection_pool.get_connection()