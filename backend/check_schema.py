#!/usr/bin/env python
"""Check database schema."""

import sqlite3
import os
from pathlib import Path
from config.config import settings

# Extract database path from settings
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "", 1)
    if not Path(db_path).is_absolute():
        db_path = str(Path(__file__).resolve().parents[1] / db_path)
else:
    db_path = "credit_risk.db"

print(f"Database path: {db_path}")
print(f"Database exists: {os.path.exists(db_path)}")
print("-" * 60)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print(f"Total tables: {len(tables)}")
for table in tables:
    print(f"  - {table[0]}")

print("-" * 60)

# Check if contact_messages table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='contact_messages'")
contact_table = cursor.fetchone()

if contact_table:
    print("✓ contact_messages table EXISTS")
    cursor.execute("PRAGMA table_info(contact_messages)")
    columns = cursor.fetchall()
    print(f"  Columns: {len(columns)}")
    for col in columns:
        print(f"    - {col[1]} ({col[2]})")
    
    # Count rows
    cursor.execute("SELECT COUNT(*) FROM contact_messages")
    count = cursor.fetchone()[0]
    print(f"  Rows: {count}")
else:
    print("✗ contact_messages table NOT FOUND")

conn.close()
