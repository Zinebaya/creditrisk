#!/usr/bin/env python3
"""
Comprehensive database status and schema analysis report.
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add paths
sys.path.insert(0, r"c:\credit-risk")
sys.path.insert(0, r"c:\credit-risk\backend")

try:
    from sqlalchemy import create_engine, inspect, text
    from config.config import settings
    print("✓ SQLAlchemy and config imported successfully")
except Exception as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)

def main():
    print("\n" + "=" * 80)
    print("DATABASE SETUP STATUS REPORT")
    print("=" * 80)
    
    # 1. DATABASE FILE STATUS
    print("\n1. DATABASE FILE STATUS")
    print("-" * 80)
    
    db_url = settings.DATABASE_URL
    print(f"Configured DATABASE_URL: {db_url}")
    
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        db_path_abs = Path(db_path) if Path(db_path).is_absolute() else Path(r"c:\credit-risk") / db_path
        
        print(f"Database Type: SQLite")
        print(f"Database Path: {db_path_abs}")
        
        if db_path_abs.exists():
            stat = os.stat(db_path_abs)
            print(f"Status: ✓ EXISTS")
            print(f"Size: {stat.st_size:,} bytes")
            print(f"Last Modified: {datetime.fromtimestamp(stat.st_mtime)}")
        else:
            print(f"Status: ✗ DOES NOT EXIST (will be created)")
    else:
        print(f"Database Type: PostgreSQL/External")
        print(f"Status: External database (not checked locally)")
    
    # 2. MODEL FILES AND IMPORTS
    print("\n2. MODEL FILES AND IMPORTS")
    print("-" * 80)
    
    models_dir = Path(r"c:\credit-risk\backend\models")
    print(f"Models Directory: {models_dir}")
    print(f"Directory exists: {'✓ YES' if models_dir.exists() else '✗ NO'}")
    
    if models_dir.exists():
        py_files = sorted([f.name for f in models_dir.glob("*.py")])
        print(f"\nModel files found ({len(py_files)}):")
        for f in py_files:
            print(f"  ✓ {f}")
        
        # Check __init__.py imports
        init_file = models_dir / "__init__.py"
        if init_file.exists():
            with open(init_file) as f:
                init_content = f.read()
            print(f"\n__init__.py imports:")
            for line in init_content.split('\n'):
                line = line.strip()
                if line and not line.startswith('#'):
                    print(f"  {line}")
    
    # 3. BACKEND/MAIN.PY IMPORTS
    print("\n3. BACKEND/MAIN.PY IMPORTS")
    print("-" * 80)
    
    main_file = Path(r"c:\credit-risk\backend\main.py")
    if main_file.exists():
        with open(main_file) as f:
            main_content = f.read()
        
        import_lines = [line.strip() for line in main_content.split('\n') 
                       if 'import' in line and not line.strip().startswith('#')]
        
        print(f"Found {len(import_lines)} import statements")
        
        model_imports = [line for line in import_lines if 'models' in line.lower()]
        if model_imports:
            print(f"\nModel imports: ✓ PRESENT")
            for line in model_imports:
                print(f"  {line}")
        else:
            print(f"\nModel imports: ✗ NOT FOUND")
    
    # 4. DATABASE SCHEMA ANALYSIS
    print("\n4. DATABASE SCHEMA ANALYSIS")
    print("-" * 80)
    
    try:
        engine = create_engine(db_url, echo=False, future=True)
        inspector = inspect(engine)
        
        existing_tables = inspector.get_table_names()
        print(f"Existing tables: {len(existing_tables)}")
        
        if existing_tables:
            print(f"✓ Database has {len(existing_tables)} table(s):\n")
            for table_name in sorted(existing_tables):
                columns = inspector.get_columns(table_name)
                print(f"  Table: {table_name}")
                for col in columns:
                    col_type = str(col['type'])
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    print(f"    - {col['name']:<25} {col_type:<20} {nullable}")
                print()
        else:
            print(f"✗ Database is empty (no tables)")
        
        # 5. EXPECTED MODELS
        print("\n5. EXPECTED MODELS")
        print("-" * 80)
        
        expected = {
            "users": ["id", "email", "password_hash", "role", "plan_tier", "is_active", "created_at"],
            "clients": ["id", "name", "email", "phone", "wilaya", "city", "owner_id", "created_at"],
            "predictions": ["id", "user_id", "client_id", "input_json", "prediction", "probability", "decision", "created_at"],
            "logs": ["id", "action", "level", "details", "created_at"],
            "model_versions": ["id", "version", "metrics", "created_at"],
        }
        
        print("Expected tables and columns:")
        for table, cols in expected.items():
            exists = "✓" if table in existing_tables else "✗"
            print(f"  {exists} {table}")
            for col in cols:
                print(f"      - {col}")
        
        # 6. SCHEMA ANALYSIS
        print("\n6. SCHEMA COMPARISON")
        print("-" * 80)
        
        mismatches = []
        missing_tables = []
        
        for table_name, expected_cols in expected.items():
            if table_name not in existing_tables:
                missing_tables.append(table_name)
            else:
                actual_cols = [col['name'] for col in inspector.get_columns(table_name)]
                for expected_col in expected_cols:
                    if expected_col not in actual_cols:
                        mismatches.append(f"{table_name}.{expected_col} (missing column)")
        
        if missing_tables:
            print(f"✗ MISSING TABLES ({len(missing_tables)}):")
            for table in missing_tables:
                print(f"    - {table}")
        else:
            print(f"✓ All expected tables exist")
        
        if mismatches:
            print(f"✗ SCHEMA MISMATCHES ({len(mismatches)}):")
            for mismatch in mismatches:
                print(f"    - {mismatch}")
        else:
            print(f"✓ All expected columns present")
        
        engine.dispose()
        
    except Exception as e:
        print(f"✗ Error analyzing database: {e}")
        import traceback
        traceback.print_exc()
    
    # 7. RECOMMENDATIONS
    print("\n7. RECOMMENDATIONS")
    print("-" * 80)
    
    if not existing_tables:
        print("✓ Database is empty - ready for initialization")
        print("  Run: python init_db.py")
    elif missing_tables or mismatches:
        print("⚠ Database schema mismatch detected")
        print("  Option 1: Backup and reset database (dev only)")
        print("  Option 2: Create migration script for schema updates")
    else:
        print("✓ Database schema is up to date")
    
    print("\n" + "=" * 80 + "\n")

if __name__ == "__main__":
    main()
