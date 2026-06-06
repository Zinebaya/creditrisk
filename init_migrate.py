import subprocess
import os
import sys
from pathlib import Path

# Set up paths
project_root = Path("c:/credit-risk")
backend_dir = project_root / "backend"
os.chdir(str(project_root))

print("="*70)
print("FLASK-MIGRATE INITIALIZATION FOR CREDIT-RISK PROJECT")
print("="*70)

# Step 1: Install requirements
print("\n[Step 1] Installing requirements from requirements.txt")
print("-" * 70)
result = subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                       capture_output=True, text=True)
print(f"Status: {'SUCCESS' if result.returncode == 0 else 'FAILED'}")
if result.returncode != 0:
    print(f"Error: {result.stderr}")
else:
    print("Dependencies installed successfully")

# Step 2: Initialize Flask-Migrate
print("\n[Step 2] Initializing Flask-Migrate (flask db init)")
print("-" * 70)
os.environ['FLASK_APP'] = 'main.py'
os.chdir(str(backend_dir))
result = subprocess.run([sys.executable, "-m", "flask", "db", "init"], 
                       capture_output=True, text=True)
print(f"Status: {'SUCCESS' if result.returncode == 0 else 'FAILED'}")
print(f"Output: {result.stdout if result.stdout else result.stderr}")

# Step 3: Create migration
print("\n[Step 3] Creating migration (flask db migrate)")
print("-" * 70)
result = subprocess.run([sys.executable, "-m", "flask", "db", "migrate", "-m", "Add subscription columns to users"], 
                       capture_output=True, text=True)
print(f"Status: {'SUCCESS' if result.returncode == 0 else 'FAILED'}")
print(f"Output: {result.stdout if result.stdout else result.stderr}")

# Step 4: Apply migration
print("\n[Step 4] Applying migration (flask db upgrade)")
print("-" * 70)
result = subprocess.run([sys.executable, "-m", "flask", "db", "upgrade"], 
                       capture_output=True, text=True)
print(f"Status: {'SUCCESS' if result.returncode == 0 else 'FAILED'}")
print(f"Output: {result.stdout if result.stdout else result.stderr}")

# Step 5: Verification
print("\n[Step 5] Verification")
print("-" * 70)

os.chdir(str(project_root))

migrations_dir = backend_dir / "migrations"
versions_dir = migrations_dir / "versions"
db_file = project_root / "credit_risk.db"

print(f"Migrations folder exists: {migrations_dir.exists()}")
print(f"Versions folder exists: {versions_dir.exists()}")
print(f"Database file exists: {db_file.exists()}")

if versions_dir.exists():
    migration_files = list(versions_dir.glob("*.py"))
    print(f"\nMigration files in versions folder:")
    if migration_files:
        for mf in sorted(migration_files):
            print(f"  - {mf.name}")
    else:
        print("  (no migration files found)")

print("\n" + "="*70)
print("FLASK-MIGRATE INITIALIZATION COMPLETE")
print("="*70)
