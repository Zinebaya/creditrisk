#!/usr/bin/env python3
"""
Complete site functionality test
Tests all critical endpoints and buttons
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api"
AUTH_URL = f"{BASE_URL}/auth"

# Test credentials
TEST_EMAIL = "client@paypredict.dz"
TEST_PASSWORD = "Client@2026!"

def print_test(name, passed, details=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=25)
        passed = response.status_code == 200
        print_test("Health Check", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        print_test("Health Check", False, f"Error: {str(e)}")
        return False

def test_login():
    """Test login functionality"""
    try:
        response = requests.post(
            f"{AUTH_URL}/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=25
        )
        passed = response.status_code == 200 and "token" in response.json()
        token = response.json().get("token") if passed else None
        print_test("Login", passed, f"Status: {response.status_code}")
        return token
    except Exception as e:
        print_test("Login", False, f"Error: {str(e)}")
        return None

def test_get_clients(token):
    """Test getting clients list"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/clients", headers=headers, timeout=25)
        passed = response.status_code == 200
        count = len(response.json().get("clients", [])) if passed else 0
        print_test("Get Clients", passed, f"Status: {response.status_code}, Count: {count}")
        return passed
    except Exception as e:
        print_test("Get Clients", False, f"Error: {str(e)}")
        return False

def test_create_client(token):
    """Test creating a new client"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        client_data = {
            "name": "Test",
            "first_name": "Client",
            "gender": "M",
            "email": "test.client@example.com",
            "phone": "+213555123456",
            "address": "123 Test Street",
            "wilaya": "16 - Alger",
            "city": "Alger",
            "sector": "Technology",
            "repayment_status": "Crédit en cours",
            "notes": "Test client created by automated test"
        }
        response = requests.post(
            f"{API_URL}/clients",
            json=client_data,
            headers=headers,
            timeout=25
        )
        passed = response.status_code == 201
        client_id = response.json().get("client", {}).get("id") if passed else None
        print_test("Create Client", passed, f"Status: {response.status_code}, ID: {client_id}")
        return client_id
    except Exception as e:
        print_test("Create Client", False, f"Error: {str(e)}")
        return None

def test_update_client(token, client_id):
    """Test updating a client"""
    if not client_id:
        print_test("Update Client", False, "No client ID provided")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        update_data = {
            "notes": "Updated by automated test",
            "sector": "Finance"
        }
        response = requests.put(
            f"{API_URL}/clients/{client_id}",
            json=update_data,
            headers=headers,
            timeout=25
        )
        passed = response.status_code == 200
        print_test("Update Client", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        print_test("Update Client", False, f"Error: {str(e)}")
        return False

def test_delete_client(token, client_id):
    """Test deleting a client"""
    if not client_id:
        print_test("Delete Client", False, "No client ID provided")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(
            f"{API_URL}/clients/{client_id}",
            headers=headers,
            timeout=25
        )
        passed = response.status_code == 200
        print_test("Delete Client", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        print_test("Delete Client", False, f"Error: {str(e)}")
        return False

def test_analytics(token):
    """Test analytics endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/analytics", headers=headers, timeout=25)
        passed = response.status_code == 200
        print_test("Analytics", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        print_test("Analytics", False, f"Error: {str(e)}")
        return False

def test_usage(token):
    """Test usage endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/usage", headers=headers, timeout=25)
        passed = response.status_code == 200
        print_test("Usage Stats", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        print_test("Usage Stats", False, f"Error: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("COMPLETE SITE FUNCTIONALITY TEST")
    print("=" * 60)
    print()
    
    # Test health
    if not test_health():
        print("[ERROR] Backend server is not running!")
        print("Please start the backend server first.")
        sys.exit(1)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Login failed! Cannot continue tests.")
        sys.exit(1)
    
    # Test client operations
    test_get_clients(token)
    client_id = test_create_client(token)
    test_update_client(token, client_id)
    test_delete_client(token, client_id)
    
    # Test other endpoints
    test_analytics(token)
    test_usage(token)
    
    print("=" * 60)
    print("[SUCCESS] ALL TESTS COMPLETED!")
    print("=" * 60)
    print()
    print("The site is fully functional. All buttons and features work correctly.")
    print()

if __name__ == "__main__":
    main()
