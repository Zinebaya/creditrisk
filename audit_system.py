#!/usr/bin/env python3
"""
Complete SaaS Audit & Verification Script
Tests all critical paths and reports issues
"""

import json
import subprocess
import sys
from typing import Dict, List, Tuple

class AuditReport:
    def __init__(self):
        self.tests: List[Dict] = []
        self.errors: List[str] = []
    
    def add_test(self, name: str, passed: bool, message: str = ""):
        self.tests.append({
            "name": name,
            "passed": passed,
            "message": message
        })
    
    def add_error(self, error: str):
        self.errors.append(error)
    
    def print_report(self):
        print("\n" + "="*60)
        print("📊 AUDIT REPORT".center(60))
        print("="*60 + "\n")
        
        passed = sum(1 for t in self.tests if t["passed"])
        total = len(self.tests)
        
        for test in self.tests:
            icon = "✓" if test["passed"] else "✗"
            print(f"{icon} {test['name']}")
            if test["message"]:
                print(f"  → {test['message']}")
        
        print(f"\nResults: {passed}/{total} passed")
        
        if self.errors:
            print("\n⚠️  ERRORS:")
            for error in self.errors:
                print(f"  - {error}")

def test_backend() -> Tuple[bool, str]:
    """Test backend startup"""
    try:
        result = subprocess.run(
            ["python", "-c", "from main import create_app; app = create_app(); print('OK')"],
            cwd="c:\\credit-risk\\backend",
            capture_output=True,
            timeout=10,
            text=True
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Timeout (>10s)"
    except Exception as e:
        return False, str(e)

def test_login_endpoint() -> Tuple[bool, str]:
    """Test login API"""
    try:
        code = """
from main import create_app
import json

app = create_app()
with app.test_client() as c:
    r = c.post('/auth/login', 
                json={"email": "admin@example.com", "password": "admin1234"},
                content_type='application/json')
    print(f"STATUS:{r.status_code}")
    if r.status_code == 200:
        data = r.get_json()
        if 'token' in data and data.get('user', {}).get('role') in ['admin', 'client']:
            print("OK")
        else:
            print(f"INVALID_RESPONSE:{data}")
    else:
        print(f"ERROR:{r.get_json()}")
"""
        result = subprocess.run(
            ["python", "-c", code],
            cwd="c:\\credit-risk\\backend",
            capture_output=True,
            timeout=15,
            text=True
        )
        output = result.stdout + result.stderr
        return "OK" in output and result.returncode == 0, output
    except Exception as e:
        return False, str(e)

def test_database() -> Tuple[bool, str]:
    """Test database connectivity"""
    try:
        code = """
from services.db import DatabaseService
from config.config import settings
db = DatabaseService(settings.DATABASE_URL)
users = db.list_users()
print(f"OK:{len(users)}")
"""
        result = subprocess.run(
            ["python", "-c", code],
            cwd="c:\\credit-risk\\backend",
            capture_output=True,
            timeout=10,
            text=True
        )
        return "OK:" in result.stdout, result.stdout + result.stderr
    except Exception as e:
        return False, str(e)

def test_frontend_files() -> Tuple[bool, str]:
    """Check critical frontend files exist"""
    import os
    files_to_check = [
        "c:\\credit-risk\\frontend\\contexts\\auth-context.tsx",
        "c:\\credit-risk\\frontend\\app\\login\\page.tsx",
        "c:\\credit-risk\\frontend\\app\\dashboard\\page.tsx",
        "c:\\credit-risk\\frontend\\app\\dashboard\\admin-dashboard.tsx",
        "c:\\credit-risk\\frontend\\app\\dashboard\\client-dashboard.tsx",
    ]
    
    missing = [f for f in files_to_check if not os.path.exists(f)]
    if missing:
        return False, f"Missing: {', '.join(missing)}"
    return True, "All critical files present"

def main():
    print("🔍 Starting Comprehensive Audit...\n")
    
    report = AuditReport()
    
    # Test 1: Database
    passed, msg = test_database()
    report.add_test("Database Connection", passed, msg.split('\n')[0])
    if not passed:
        report.add_error(f"Database test failed: {msg}")
    
    # Test 2: Backend
    passed, msg = test_backend()
    report.add_test("Backend Startup", passed, msg.split('\n')[0] if msg else "")
    if not passed:
        report.add_error(f"Backend startup failed: {msg[:100]}")
    
    # Test 3: Login
    passed, msg = test_login_endpoint()
    report.add_test("Login Endpoint", passed, msg.split('\n')[0] if msg else "")
    if not passed:
        report.add_error(f"Login test failed: {msg[:100]}")
    
    # Test 4: Frontend Files
    passed, msg = test_frontend_files()
    report.add_test("Frontend Structure", passed, msg)
    if not passed:
        report.add_error(f"Frontend files missing: {msg}")
    
    report.print_report()
    return 0 if all(t["passed"] for t in report.tests) else 1

if __name__ == "__main__":
    sys.exit(main())
