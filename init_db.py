#!/usr/bin/env python3
"""
Database initialization script.
Creates all tables using SQLAlchemy models.
Handles SQLite and PostgreSQL databases.
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from models.base import Base
from models.user import User
from models.client import Client
from models.prediction import Prediction
from models.log import Log
from models.model_version import ModelVersion

from sqlalchemy import create_engine, inspect
from config.config import settings


def check_database_exists(database_url: str) -> bool:
    """Check if the database file exists (for SQLite) or is reachable."""
    if database_url.startswith("sqlite:///"):
        db_path = database_url.replace("sqlite:///", "")
        return os.path.exists(db_path)
    # For other databases, we'll handle differently
    return False


def get_table_info(engine) -> dict:
    """Get information about existing tables and columns."""
    inspector = inspect(engine)
    tables = {}
    for table_name in inspector.get_table_names():
        tables[table_name] = {
            "columns": {col["name"]: col["type"] for col in inspector.get_columns(table_name)},
            "primary_keys": [pk["name"] for pk in inspector.get_pk_constraint(table_name)["constrained_columns"]],
        }
    return tables


def initialize_database():
    """Initialize database with all models."""
    database_url = settings.DATABASE_URL
    db_type = "SQLite" if database_url.startswith("sqlite:///") else "PostgreSQL"
    
    print(f"\n{'='*60}")
    print(f"Database Initialization Script")
    print(f"{'='*60}")
    print(f"Database Type: {db_type}")
    print(f"Database URL: {database_url}")
    
    # Check if database file exists
    if db_type == "SQLite":
        db_path = database_url.replace("sqlite:///", "")
        exists = os.path.exists(db_path)
        print(f"Database File: {db_path}")
        print(f"Exists: {'Yes' if exists else 'No'}")
    
    # Create engine
    print(f"\nCreating database engine...")
    engine = create_engine(database_url, echo=False, future=True)
    
    # Check current schema
    print(f"\nChecking existing schema...")
    existing_tables = get_table_info(engine)
    
    if existing_tables:
        print(f"Found {len(existing_tables)} existing table(s):")
        for table_name, info in existing_tables.items():
            print(f"  - {table_name}")
            for col_name, col_type in info["columns"].items():
                print(f"      {col_name}: {col_type}")
    else:
        print("No existing tables found.")
    
    # Compare with models
    print(f"\nExpected models:")
    expected_models = {
        User.__tablename__: User,
        Client.__tablename__: Client,
        Prediction.__tablename__: Prediction,
        Log.__tablename__: Log,
        ModelVersion.__tablename__: ModelVersion,
    }
    
    for table_name, model in expected_models.items():
        print(f"  - {table_name}")
    
    # Create all tables
    print(f"\nCreating all tables...")
    try:
        Base.metadata.create_all(engine)
        print("✓ Tables created successfully!")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        sys.exit(1)
    
    # Verify schema
    print(f"\nVerifying final schema...")
    final_tables = get_table_info(engine)
    
    print(f"Final schema has {len(final_tables)} table(s):")
    for table_name, info in final_tables.items():
        print(f"  - {table_name}")
        for col_name, col_type in info["columns"].items():
            print(f"      {col_name}: {col_type}")
    
    print(f"\n{'='*60}")
    print(f"Database initialization complete!")
    print(f"{'='*60}\n")
    
    engine.dispose()


if __name__ == "__main__":
    initialize_database()
