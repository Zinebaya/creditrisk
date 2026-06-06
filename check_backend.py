#!/usr/bin/env python3
"""
Verify backend is running and all endpoints are available
"""
import requests
import json
import sys
import time

API_URL = "http://127.0.0.1:8000"

print("\n" + "="*70)
print("BACKEND VERIFICATION")
print("="*70)

# Step 1: Check if backend is responding
print("\n1️⃣  Checking if backend is running...")
try:
    start = time.time()
    resp = requests.get(f"{API_URL}/api/health", timeout=3)
    elapsed = time.time() - start
    print(f"   ✅ Backend is responding (took {elapsed:.2f}s)")
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.json()}")
except requests.exceptions.ConnectionError:
    print(f"   ❌ BACKEND NOT RUNNING!")
    print(f"   Tried: {API_URL}/")
    print(f"   Make sure to run: python run.py")
    sys.exit(1)
except requests.exceptions.Timeout:
    print(f"   ⚠️  Backend responding very slowly (timeout)")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

# Step 2: Create test user if needed
EMAIL = "zinebmd098@gmail.com"
PASSWORD = "adem1509"

print(f"\n2️⃣  Testing login with {EMAIL}...")
try:
    resp = requests.post(
        f"{API_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=5
    )
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"   ✅ Login successful")
        print(f"   Response has 'token': {'token' in data}")
        print(f"   Response has 'user': {'user' in data}")
        
        if 'token' in data:
            token = data['token']
            print(f"   Token: {token[:40]}...")
            
            # Step 3: Test /auth/me endpoint
            print(f"\n3️⃣  Testing /auth/me endpoint...")
            me_resp = requests.get(
                f"{API_URL}/auth/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5
            )
            print(f"   Status: {me_resp.status_code}")
            if me_resp.status_code == 200:
                print(f"   ✅ /auth/me endpoint working")
                print(f"   Response: {json.dumps(me_resp.json(), indent=6)}")
            else:
                print(f"   ❌ /auth/me endpoint failed")
                print(f"   Response: {me_resp.json()}")
        else:
            print(f"   ❌ Response missing 'token' key!")
            print(f"   Got: {json.dumps(data, indent=2)}")
    else:
        print(f"   ❌ Login failed")
        print(f"   Response: {resp.json()}")
except requests.exceptions.Timeout:
    print(f"   ⏱️  Request timeout (5s) - backend is slow")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*70)
print("END VERIFICATION")
print("="*70 + "\n")
