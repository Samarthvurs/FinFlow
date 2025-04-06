import os
import json
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta

# User database path
DB_PATH = "finflow.db"

def init_db():
    """Initialize database and tables if they don't exist"""
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            monthly_income REAL DEFAULT 0,
            monthly_limit REAL DEFAULT 0,
            created_at TEXT,
            last_login TEXT
        )
        ''')
        
        # Create sessions table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            created_at TEXT,
            expires_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        # Create recurring expenses table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS recurring_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            day_of_month INTEGER NOT NULL,
            next_due TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        conn.commit()
        conn.close()
        
def hash_password(password):
    """Hash a password for storing."""
    salt = hashlib.sha256(os.urandom(60)).hexdigest()
    pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), 
                                salt.encode('ascii'), 100000)
    pwdhash = pwdhash.hex()
    return salt + pwdhash
    
def verify_password(stored_password, provided_password):
    """Verify a stored password against one provided by user"""
    salt = stored_password[:64]
    stored_password = stored_password[64:]
    pwdhash = hashlib.pbkdf2_hmac('sha512', 
                                provided_password.encode('utf-8'), 
                                salt.encode('ascii'), 
                                100000)
    pwdhash = pwdhash.hex()
    return pwdhash == stored_password

def create_user(email, password, full_name, monthly_income):
    """Create a new user in the database"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        hashed_pwd = hash_password(password)
        now = datetime.now().isoformat()
        
        cursor.execute('''
        INSERT INTO users (email, password_hash, full_name, monthly_income, created_at)
        VALUES (?, ?, ?, ?, ?)
        ''', (email, hashed_pwd, full_name, monthly_income, now))
        
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        # Email already exists
        return None
    finally:
        conn.close()

def login_user(email, password):
    """Verify user credentials and create a session"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if user and verify_password(user['password_hash'], password):
        # Update last login
        now = datetime.now().isoformat()
        cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user['id']))
        
        # Create a new session
        token = secrets.token_hex(32)
        expires_at = (datetime.now() + timedelta(days=30)).isoformat()
        
        cursor.execute('''
        INSERT INTO sessions (user_id, token, created_at, expires_at)
        VALUES (?, ?, ?, ?)
        ''', (user['id'], token, now, expires_at))
        
        conn.commit()
        
        # Return user data and session token
        return {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'monthly_income': user['monthly_income'],
            'monthly_limit': user['monthly_limit'],
            'token': token
        }
    
    conn.close()
    return None

def get_user_by_token(token):
    """Get user data from a session token"""
    if not token:
        return None
        
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    
    cursor.execute('''
    SELECT u.* FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ?
    ''', (token, now))
    
    user = cursor.fetchone()
    
    if user:
        return dict(user)
    
    conn.close()
    return None

def update_user_limit(user_id, monthly_limit):
    """Update a user's monthly spending limit"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("UPDATE users SET monthly_limit = ? WHERE id = ?", (monthly_limit, user_id))
    conn.commit()
    conn.close()
    
    return True

def logout_user(token):
    """Remove a user's session"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()
    
    return True

def add_recurring_expense(user_id, name, category, amount, day_of_month):
    """Add a recurring expense for a user"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Calculate next due date
    today = datetime.now()
    next_due_day = int(day_of_month)
    if next_due_day > 28:
        next_due_day = 28  # Limit to avoid month boundary issues
        
    next_due = datetime(today.year, today.month, next_due_day)
    if next_due < today:
        # If the day has passed this month, set to next month
        if today.month == 12:
            next_due = datetime(today.year + 1, 1, next_due_day)
        else:
            next_due = datetime(today.year, today.month + 1, next_due_day)
    
    now = datetime.now().isoformat()
    next_due_iso = next_due.isoformat().split('T')[0]
    
    cursor.execute('''
    INSERT INTO recurring_expenses (user_id, name, category, amount, day_of_month, next_due, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, name, category, amount, day_of_month, next_due_iso, now))
    
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return expense_id

def get_recurring_expenses(user_id):
    """Get all recurring expenses for a user"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT * FROM recurring_expenses
    WHERE user_id = ?
    ORDER BY day_of_month ASC
    ''', (user_id,))
    
    expenses = []
    for row in cursor.fetchall():
        expenses.append(dict(row))
    
    conn.close()
    return expenses

def delete_recurring_expense(expense_id, user_id):
    """Delete a recurring expense"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
    DELETE FROM recurring_expenses
    WHERE id = ? AND user_id = ?
    ''', (expense_id, user_id))
    
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return deleted 