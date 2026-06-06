#!/usr/bin/env python3
"""
Diagnostic script to test login flow
"""
import requests
import json

API_URL = "http://127.0.0.1:8000"
EMAIL = "zinebmd098@gmail.com"
PASSWORD = "adem1509"

print("=" * 60)
print("LOGIN DIAGNOSTIC")
print("=" * 60)

# Test 1: API Health
print("\n1. Testing API Health...")
try:
    resp = requests.get(f"{API_URL}/api/health", timeout=5)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.json()}")
except Exception as e:
    print(f"   ❌ FAILED: {str(e)}")
    print("   Backend is NOT running!")
    exit(1)

# Test 2: Login Request
print(f"\n2. Testing Login with {EMAIL}...")
payload = {"email": EMAIL, "password": PASSWORD}
print(f"   Payload: {json.dumps(payload)}")

try:
    resp = requests.post(
        f"{API_URL}/auth/login",
        json=payload,
        timeout=5,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    
    if resp.status_code == 200:
        data = resp.json()
        if "token" in data and "user" in data:
            print(f"   ✅ Login successful!")
            print(f"   Token: {data['token'][:30]}...")
            print(f"   User: {data['user']}")
        else:
            print(f"   ❌ Missing token or user in response")
    else:
        print(f"   ❌ Login failed with status {resp.status_code}")
        
except Exception as e:
    print(f"   ❌ FAILED: {str(e)}")

# Test 3: Check database
print(f"\n3. Checking database...")
try:
    from services.db import DatabaseService
    from config.config import settings
    
    db = DatabaseService(settings.DATABASE_URL)
    users = db.list_users()
    print(f"   Users in DB: {len(users)}")
    for user in users:
        print(f"   - {user['email']} (role: {user['role']})")
    
    hashed = db.verify_user_password(EMAIL)
    if hashed:
        print(f"   ✅ User password found in DB")
    else:
        print(f"   ❌ User NOT found in DB!")
        
except Exception as e:
    print(f"   ❌ DB Error: {str(e)}")

print("\n" + "=" * 60)
print("END DIAGNOSTIC")
print("=" * 60)
