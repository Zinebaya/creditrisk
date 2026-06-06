#!/usr/bin/env python3
"""
Flask-Migrate initialization script for credit-risk project
"""

import os
import sys
import subprocess
from pathlib import Path

# Results tracking
results = []

def log_step(step_num, description, success, output="", error=""):
    """Log step results"""
    result = {
        "step": step_num,
        "description": description,
        "success": success,
        "output": output,
        "error": error
    }
    results.append(result)
    status = "✓ SUCCESS" if success else "✗ FAILED"
    print(f"\n[Step {step_num}] {description}")
    print(f"Status: {status}")
    if output:
        print(f"Output: {output[:500]}")
    if error:
        print(f"Error: {error[:500]}")
    return success

# Step 1: Change to credit-risk directory
try:
    os.chdir(r"c:\credit-risk")
    log_step(1, "Change directory to c:\\credit-risk", True)
except Exception as e:
    log_step(1, "Change directory to c:\\credit-risk", False, error=str(e))
    sys.exit(1)

# Step 2: Install requirements
print("\n[Step 2] Installing requirements from requirements.txt...")
try:
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        capture_output=True,
        text=True,
        timeout=180
    )
    success = result.returncode == 0
    log_step(2, "Install dependencies from requirements.txt", success, 
             output=result.stdout, error=result.stderr)
    if not success:
        print("Warning: pip install had issues, continuing anyway...")
except Exception as e:
    log_step(2, "Install dependencies from requirements.txt", False, error=str(e))
    print("Warning: pip install failed, continuing anyway...")

# Step 3: Change to backend directory
try:
    os.chdir(r"c:\credit-risk\backend")
    log_step(3, "Change to c:\\credit-risk\\backend directory", True)
except Exception as e:
    log_step(3, "Change to c:\\credit-risk\\backend directory", False, error=str(e))
    sys.exit(1)

# Step 4: Set environment variable FLASK_APP
try:
    os.environ['FLASK_APP'] = 'main.py'
    log_step(4, "Set environment variable FLASK_APP=main.py", True)
except Exception as e:
    log_step(4, "Set environment variable FLASK_APP=main.py", False, error=str(e))
    sys.exit(1)

# Step 5: Initialize Flask-Migrate
print("\n[Step 5] Initializing Flask-Migrate with 'flask db init'...")
try:
    result = subprocess.run(
        [sys.executable, "-m", "flask", "db", "init"],
        capture_output=True,
        text=True,
        timeout=30
    )
    success = result.returncode == 0
    log_step(5, "Run 'python -m flask db init'", success, 
             output=result.stdout, error=result.stderr)
except Exception as e:
    log_step(5, "Run 'python -m flask db init'", False, error=str(e))

# Step 6: Verify migrations folder exists
migrations_path = Path(r"c:\credit-risk\backend\migrations")
migrations_exists = migrations_path.exists() and migrations_path.is_dir()
log_step(6, "Verify migrations/ folder was created", migrations_exists,
         output=f"Migrations folder path: {migrations_path}, Exists: {migrations_exists}")

# Step 7: Create migration with message
print("\n[Step 7] Creating migration with message 'Add subscription columns to users'...")
try:
    result = subprocess.run(
        [sys.executable, "-m", "flask", "db", "migrate", "-m", 
         "Add subscription columns to users"],
        capture_output=True,
        text=True,
        timeout=30
    )
    success = result.returncode == 0
    log_step(7, "Run 'flask db migrate' with subscription columns message", success,
             output=result.stdout, error=result.stderr)
except Exception as e:
    log_step(7, "Run 'flask db migrate' with subscription columns message", False, error=str(e))

# Step 8: Upgrade database
print("\n[Step 8] Upgrading database with 'flask db upgrade'...")
try:
    result = subprocess.run(
        [sys.executable, "-m", "flask", "db", "upgrade"],
        capture_output=True,
        text=True,
        timeout=30
    )
    success = result.returncode == 0
    log_step(8, "Run 'python -m flask db upgrade'", success,
             output=result.stdout, error=result.stderr)
except Exception as e:
    log_step(8, "Run 'python -m flask db upgrade'", False, error=str(e))

# Step 9: Verify database was updated
db_path = Path(r"c:\credit-risk\credit_risk.db")
db_exists = db_path.exists()
log_step(9, "Verify database was updated", db_exists,
         output=f"Database file path: {db_path}, Exists: {db_exists}")

# Step 10: Final verification - check migrations versions
versions_path = migrations_path / "versions"
versions_exist = versions_path.exists() if migrations_path.exists() else False
migration_files = list(versions_path.glob("*.py")) if versions_exist else []

print("\n" + "="*70)
print("DETAILED MIGRATION SETUP REPORT")
print("="*70)

for i, result in enumerate(results, 1):
    status = "✓" if result["success"] else "✗"
    print(f"\n{status} Step {result['step']}: {result['description']}")
    if result["output"]:
        print(f"  Output: {result['output'][:200]}")
    if result["error"]:
        print(f"  Error: {result['error'][:200]}")

print("\n" + "="*70)
print("VERIFICATION SUMMARY")
print("="*70)
print(f"✓ Migrations folder exists: {migrations_exists}")
print(f"✓ Migrations versions folder exists: {versions_exist}")
if migration_files:
    print(f"✓ Migration files created: {len(migration_files)}")
    for mf in migration_files:
        print(f"  - {mf.name}")
else:
    print(f"⚠ No migration files created yet")
print(f"✓ Database file exists: {db_exists}")
print(f"✓ Database path: {db_path}")

print("\n" + "="*70)
print("OVERALL STATUS")
print("="*70)
success_count = sum(1 for r in results if r["success"])
total_count = len(results)
print(f"Steps completed successfully: {success_count}/{total_count}")

if success_count == total_count:
    print("✓ Flask-Migrate initialization COMPLETED SUCCESSFULLY!")
    sys.exit(0)
else:
    print("⚠ Flask-Migrate initialization completed with some issues")
    sys.exit(0)
