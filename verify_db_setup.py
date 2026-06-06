#!/usr/bin/env python3
"""
Final database setup verification script.
Checks all components are correctly configured.
"""

import sys
from pathlib import Path

# Add paths
sys.path.insert(0, r"c:\credit-risk")
sys.path.insert(0, r"c:\credit-risk\backend")

print("\n" + "=" * 80)
print("DATABASE SETUP VERIFICATION")
print("=" * 80)

# 1. Check database file
print("\n✓ Step 1: Database File Check")
db_path = Path(r"c:\credit-risk\credit_risk.db")
if db_path.exists():
    size_mb = db_path.stat().st_size / (1024 * 1024)
    print(f"  ✓ Database file exists: {db_path}")
    print(f"  ✓ Size: {size_mb:.2f} MB")
else:
    print(f"  ✗ Database file not found: {db_path}")

# 2. Check model files
print("\n✓ Step 2: Model Files Check")
models_dir = Path(r"c:\credit-risk\backend\models")
expected_models = ["base.py", "user.py", "client.py", "prediction.py", "log.py", "model_version.py", "__init__.py"]
all_exist = True
for model_file in expected_models:
    model_path = models_dir / model_file
    if model_path.exists():
        print(f"  ✓ {model_file}")
    else:
        print(f"  ✗ {model_file} MISSING")
        all_exist = False

if all_exist:
    print(f"  ✓ All model files present")

# 3. Check imports
print("\n✓ Step 3: Import Verification")
try:
    from models import Base, User, Client, Prediction, Log, ModelVersion
    print(f"  ✓ Base imported")
    print(f"  ✓ User imported")
    print(f"  ✓ Client imported")
    print(f"  ✓ Prediction imported")
    print(f"  ✓ Log imported")
    print(f"  ✓ ModelVersion imported")
except ImportError as e:
    print(f"  ✗ Import failed: {e}")
    sys.exit(1)

# 4. Check main.py
print("\n✓ Step 4: Backend/main.py Verification")
main_file = Path(r"c:\credit-risk\backend\main.py")
with open(main_file) as f:
    main_content = f.read()

if "from models import Base, User, Client, Prediction, Log" in main_content:
    print(f"  ✓ Correct model imports in main.py")
elif "from models import Base, User, Client, Prediction, LogEntry" in main_content:
    print(f"  ✗ INCORRECT: main.py still imports LogEntry instead of Log")
    sys.exit(1)
else:
    print(f"  ✗ Model imports not found in main.py")
    sys.exit(1)

# 5. Verify config
print("\n✓ Step 5: Configuration Check")
try:
    from config.config import settings
    print(f"  ✓ Settings loaded")
    print(f"  ✓ DATABASE_URL: {settings.DATABASE_URL[:50]}...")
    print(f"  ✓ FLASK_ENV: {settings.FLASK_ENV}")
except Exception as e:
    print(f"  ✗ Config error: {e}")
    sys.exit(1)

# 6. Create tables test (optional)
print("\n✓ Step 6: Database Engine Test")
try:
    from sqlalchemy import create_engine, inspect
    engine = create_engine(settings.DATABASE_URL, echo=False, future=True)
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"  ✓ Database engine created successfully")
    print(f"  ✓ Existing tables: {existing_tables if existing_tables else 'None (will be created)'}")
    engine.dispose()
except Exception as e:
    print(f"  ✗ Database engine error: {e}")
    sys.exit(1)

print("\n" + "=" * 80)
print("✓ ALL CHECKS PASSED - Database setup is ready!")
print("=" * 80)
print("\nNext steps:")
print("  1. Run: python init_db.py (to create/verify schema)")
print("  2. Run: python test_backend.py (to verify database operations)")
print("=" * 80 + "\n")
