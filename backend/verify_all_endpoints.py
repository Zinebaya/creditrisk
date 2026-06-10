#!/usr/bin/env python3
import requests
import json
import sys

API_URL = "http://127.0.0.1:8000"

print("=" * 70)
print("PAYPREDICT COMPREHENSIVE BACKEND VERIFICATION SCRIPT")
print("=" * 70)

# Helper function to print test status
def print_result(name, status_code, data=None):
    if 200 <= status_code < 300:
        print(f"✅ [PASS] {name} (Status: {status_code})")
        if data is not None:
            # print a snippet or count
            if isinstance(data, dict):
                keys = list(data.keys())
                print(f"   Keys returned: {keys}")
                for key in ['users', 'admins', 'clients', 'predictions', 'logs', 'monthly_predictions']:
                    if key in data and isinstance(data[key], list):
                        print(f"   - Number of {key}: {len(data[key])}")
            elif isinstance(data, list):
                print(f"   - Number of items: {len(data)}")
    else:
        print(f"❌ [FAIL] {name} (Status: {status_code})")
        print(f"   Response: {data}")

# Test 1: Health Check
try:
    resp = requests.get(f"{API_URL}/health", timeout=5)
    print_result("Health Check", resp.status_code, resp.json())
except Exception as e:
    print(f"❌ [FAIL] Health Check failed: {e}")
    sys.exit(1)

# Test 2: Admin Login
admin_token = None
try:
    resp = requests.post(
        f"{API_URL}/auth/login",
        json={"email": "admin@paypredict.dz", "password": "Admin@2026!"},
        timeout=5
    )
    print_result("Admin Login", resp.status_code)
    if resp.status_code == 200:
        data = resp.json()
        admin_token = data.get("token")
except Exception as e:
    print(f"❌ [FAIL] Admin Login request failed: {e}")

if not admin_token:
    print("Skipping admin authenticated tests because admin login failed.")
else:
    # Test 3: Admin Auth Me
    try:
        resp = requests.get(f"{API_URL}/auth/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
        print_result("Admin /auth/me", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Admin /auth/me failed: {e}")

    # Test 4: Admin List Admins
    try:
        resp = requests.get(f"{API_URL}/auth/admins", headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
        print_result("Admin /auth/admins", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Admin /auth/admins failed: {e}")

    # Test 5: Admin List Users
    try:
        resp = requests.get(f"{API_URL}/auth/users", headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
        print_result("Admin /auth/users", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Admin /auth/users failed: {e}")

    # Test 6: Admin Platform Stats
    try:
        resp = requests.get(f"{API_URL}/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
        print_result("Admin /api/admin/stats", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Admin /api/admin/stats failed: {e}")

    # Test 7: Admin Get All Predictions
    try:
        resp = requests.get(f"{API_URL}/api/admin/predictions", headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
        print_result("Admin /api/admin/predictions", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Admin /api/admin/predictions failed: {e}")

    # Test 8: Admin Get Logs
    try:
        resp = requests.get(f"{API_URL}/api/admin/logs", headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
        print_result("Admin /api/admin/logs", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Admin /api/admin/logs failed: {e}")


# Test 9: Client Login
client_token = None
try:
    resp = requests.post(
        f"{API_URL}/auth/login",
        json={"email": "client@paypredict.dz", "password": "Client@2026!"},
        timeout=5
    )
    print_result("Client Login", resp.status_code)
    if resp.status_code == 200:
        data = resp.json()
        client_token = data.get("token")
except Exception as e:
    print(f"❌ [FAIL] Client Login request failed: {e}")

if not client_token:
    print("Skipping client authenticated tests because client login failed.")
else:
    # Test 10: Client Auth Me
    try:
        resp = requests.get(f"{API_URL}/auth/me", headers={"Authorization": f"Bearer {client_token}"}, timeout=5)
        print_result("Client /auth/me", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Client /auth/me failed: {e}")

    # Test 11: Client API Usage
    try:
        resp = requests.get(f"{API_URL}/api/usage", headers={"Authorization": f"Bearer {client_token}"}, timeout=5)
        print_result("Client /api/usage", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Client /api/usage failed: {e}")

    # Test 12: Client List Clients
    try:
        resp = requests.get(f"{API_URL}/api/clients", headers={"Authorization": f"Bearer {client_token}"}, timeout=5)
        print_result("Client /api/clients", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Client /api/clients failed: {e}")

    # Test 13: Client Analytics
    try:
        resp = requests.get(f"{API_URL}/api/analytics", headers={"Authorization": f"Bearer {client_token}"}, timeout=5)
        print_result("Client /api/analytics", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Client /api/analytics failed: {e}")

    # Test 14: Client History
    try:
        resp = requests.get(f"{API_URL}/api/history", headers={"Authorization": f"Bearer {client_token}"}, timeout=5)
        print_result("Client /api/history", resp.status_code, resp.json())
    except Exception as e:
        print(f"❌ [FAIL] Client /api/history failed: {e}")

print("=" * 70)
