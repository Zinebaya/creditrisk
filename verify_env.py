#!/usr/bin/env python3
"""Verify environment and dependencies"""
import sys
import os

print("="*70)
print("ENVIRONMENT VERIFICATION")
print("="*70)

print(f"\nPython executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")

print("\n" + "="*70)
print("CHECKING REQUIRED PACKAGES")
print("="*70)

packages = [
    'flask',
    'flask_sqlalchemy',
    'flask_migrate',
    'alembic',
    'sqlalchemy',
]

for package in packages:
    try:
        mod = __import__(package.replace('-', '_'))
        version = getattr(mod, '__version__', 'unknown')
        print(f"✓ {package}: {version}")
    except ImportError as e:
        print(f"✗ {package}: NOT INSTALLED")

print("\n" + "="*70)
print("CHECKING BACKEND STRUCTURE")
print("="*70)

backend_path = "c:\\credit-risk\\backend"
checks = {
    "main.py": os.path.join(backend_path, "main.py"),
    "models": os.path.join(backend_path, "models"),
    "config": os.path.join(backend_path, "config"),
    "migrations": os.path.join(backend_path, "migrations"),
}

for name, path in checks.items():
    if os.path.exists(path):
        print(f"✓ {name} exists: {path}")
    else:
        print(f"✗ {name} NOT FOUND: {path}")

print("\nDone!")
