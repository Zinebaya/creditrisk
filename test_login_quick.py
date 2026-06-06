#!/usr/bin/env python3
"""
Quick test of the fixed login flow
"""
import requests
import json
import sys

API_URL = "http://127.0.0.1:8000"
EMAIL = "zinebmd098@gmail.com"
PASSWORD = "adem1509"

print("\n" + "="*60)
print("QUICK LOGIN TEST")
print("="*60)

# Step 1: Health check
print("\n1️⃣  Health Check...")
try:
    resp = requests.get(f"{API_URL}/", timeout=2)
    print(f"   ✅ Backend responding: {resp.status_code}")
except Exception as e:
    print(f"   ❌ Backend not running: {e}")
    sys.exit(1)

# Step 2: Login
print(f"\n2️⃣  Testing /auth/login...")
try:
    resp = requests.post(
        f"{API_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=5
    )
    print(f"   Status: {resp.status_code}")
    data = resp.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 200 and "token" in data and "user" in data:
        token = data["token"]
        user = data["user"]
        print(f"\n   ✅ Login successful!")
        print(f"   Token: {token[:40]}...")
        print(f"   User: {user['email']} (role: {user.get('role')})")
        
        # Step 3: Test /me endpoint
        print(f"\n3️⃣  Testing /auth/me...")
        me_resp = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        print(f"   Status: {me_resp.status_code}")
        me_data = me_resp.json()
        print(f"   Response: {json.dumps(me_data, indent=2)}")
        
        if me_resp.status_code == 200:
            print(f"\n   ✅ /auth/me successful!")
        else:
            print(f"\n   ❌ /auth/me failed!")
            sys.exit(1)
    else:
        print(f"\n   ❌ Login failed!")
        sys.exit(1)
        
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

print("\n" + "="*60)
print("✅ ALL TESTS PASSED!")
print("="*60 + "\n")
