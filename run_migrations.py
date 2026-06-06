#!/usr/bin/env python
"""Flask-Migrate initialization script"""
import os
import sys
import subprocess

os.chdir('c:\\credit-risk')

print("=" * 80)
print("STEP 1: Installing requirements.txt")
print("=" * 80)
result = subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                       capture_output=False)
if result.returncode != 0:
    print("❌ Failed to install requirements")
    sys.exit(1)
print("✓ Requirements installed successfully\n")

print("=" * 80)
print("STEP 2: Running 'flask db init' from backend directory")
print("=" * 80)
os.chdir('c:\\credit-risk\\backend')
os.environ['FLASK_APP'] = 'main.py'
result = subprocess.run([sys.executable, '-m', 'flask', 'db', 'init'], 
                       capture_output=False)
if result.returncode != 0:
    print("❌ Failed to initialize Flask-Migrate")
    sys.exit(1)
print("✓ Flask-Migrate initialized\n")

# Check if migrations folder was created
if os.path.exists('migrations'):
    print("✓ migrations/ folder created successfully")
    if os.path.exists('migrations/alembic.ini'):
        print("✓ alembic.ini found")
    if os.path.exists('migrations/versions'):
        print("✓ versions/ folder found")
else:
    print("❌ migrations/ folder was NOT created")

print("\n" + "=" * 80)
print("STEP 3: Running 'flask db migrate'")
print("=" * 80)
result = subprocess.run([sys.executable, '-m', 'flask', 'db', 'migrate', 
                        '-m', 'Add subscription columns to users'], 
                       capture_output=False)
if result.returncode != 0:
    print("❌ Failed to create migration")
    sys.exit(1)
print("✓ Migration created successfully\n")

print("=" * 80)
print("STEP 4: Running 'flask db upgrade'")
print("=" * 80)
result = subprocess.run([sys.executable, '-m', 'flask', 'db', 'upgrade'], 
                       capture_output=False)
if result.returncode != 0:
    print("❌ Failed to upgrade database")
    sys.exit(1)
print("✓ Database upgraded successfully\n")

# Verify
print("=" * 80)
print("VERIFICATION")
print("=" * 80)
os.chdir('c:\\credit-risk\\backend')
if os.path.exists('migrations'):
    print("✓ migrations/ folder exists")
    files = os.listdir('migrations')
    print(f"  Contents: {', '.join(sorted(files))}")
else:
    print("❌ migrations/ folder does not exist")

if os.path.exists('..\\credit_risk.db'):
    print("✓ credit_risk.db database file exists")
    db_size = os.path.getsize('..\\credit_risk.db')
    print(f"  Size: {db_size} bytes")
else:
    print("⚠ credit_risk.db not found (may be created on first access)")

print("\n" + "=" * 80)
print("✓ ALL STEPS COMPLETED SUCCESSFULLY")
print("=" * 80)
