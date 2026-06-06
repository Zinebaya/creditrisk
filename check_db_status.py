import os
import sys
from pathlib import Path

# Check database file
db_path = r"c:\credit-risk\credit_risk.db"
exists = os.path.exists(db_path)

print("=" * 60)
print("DATABASE STATUS CHECK")
print("=" * 60)
print(f"Database path: {db_path}")
print(f"Exists: {'YES' if exists else 'NO'}")

if exists:
    stat = os.stat(db_path)
    print(f"Size: {stat.st_size} bytes")
    print(f"Last modified: {stat.st_mtime}")

# Check models directory
models_dir = Path(r"c:\credit-risk\backend\models")
print(f"\nModels directory: {models_dir}")
print(f"Exists: {models_dir.exists()}")

if models_dir.exists():
    files = list(models_dir.glob("*.py"))
    print(f"Python files found: {len(files)}")
    for f in sorted(files):
        print(f"  - {f.name}")

# Check main.py imports
main_path = Path(r"c:\credit-risk\backend\main.py")
print(f"\nChecking backend/main.py imports...")
if main_path.exists():
    with open(main_path) as f:
        content = f.read()
        if "from models import" in content:
            print("✓ Models are imported in main.py")
            # Extract the import line
            for line in content.split('\n'):
                if "from models import" in line:
                    print(f"  {line.strip()}")
        else:
            print("✗ Models not imported in main.py")

print("\n" + "=" * 60)
