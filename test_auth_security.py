"""
Comprehensive authentication security testing
Validates all security improvements
"""

import sys
import json
import time
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from backend.auth.password_validation import validate_password_strength
from backend.auth.jwt import JWTService


def test_password_validation():
    """Test password strength validation"""
    print("\n" + "="*60)
    print("TESTING: Password Strength Validation")
    print("="*60)
    
    test_cases = [
        ("weak", False, "Password must be at least 8 characters"),
        ("ValidPassword1", False, "must contain at least 1 special character"),
        ("ValidPass1!", True, ""),
        ("SuperSecure#2024", True, ""),
        ("NoNumbers!", False, "must contain at least 1 number"),
        ("nonumberupcase!", False, "must contain at least 1 uppercase"),
        ("NOLOWERCASE1!", False, None),  # Should fail but not check exact message
        ("Abc1!", False, "at least 8 characters"),
    ]
    
    passed = 0
    failed = 0
    
    for password, expected_valid, expected_msg in test_cases:
        is_valid, error_msg = validate_password_strength(password)
        status = "✓" if is_valid == expected_valid else "✗"
        
        if is_valid == expected_valid:
            if expected_valid or expected_msg is None or (expected_msg and expected_msg in error_msg):
                print(f"{status} '{password}' -> Valid: {is_valid}, Msg: {error_msg}")
                passed += 1
            else:
                print(f"✗ '{password}' -> Valid: {is_valid}, Expected msg containing: {expected_msg}, Got: {error_msg}")
                failed += 1
        else:
            print(f"✗ '{password}' -> Valid: {is_valid} (expected {expected_valid}), Msg: {error_msg}")
            failed += 1
    
    print(f"\nPassword Validation: {passed} passed, {failed} failed")
    return failed == 0


def test_jwt_service():
    """Test JWT service with blacklist"""
    print("\n" + "="*60)
    print("TESTING: JWT Service with Blacklist")
    print("="*60)
    
    passed = 0
    failed = 0
    
    # Test access token creation
    token = JWTService.create_access_token("test@example.com", 1, "client")
    if token:
        print("✓ Access token created successfully")
        passed += 1
    else:
        print("✗ Failed to create access token")
        failed += 1
    
    # Test token decoding
    payload = JWTService.decode_access_token(token)
    if payload and payload.get("sub") == "test@example.com":
        print("✓ Access token decoded successfully")
        print(f"  - Sub: {payload.get('sub')}")
        print(f"  - User ID: {payload.get('user_id')}")
        print(f"  - Role: {payload.get('role')}")
        print(f"  - Scope: {payload.get('scope')}")
        passed += 1
    else:
        print("✗ Failed to decode access token")
        failed += 1
    
    # Test token blacklist
    is_blacklisted = JWTService.is_token_blacklisted(token)
    if not is_blacklisted:
        print("✓ Token not blacklisted initially")
        passed += 1
    else:
        print("✗ Token should not be blacklisted initially")
        failed += 1
    
    # Blacklist the token
    JWTService.blacklist_token(token)
    is_blacklisted = JWTService.is_token_blacklisted(token)
    if is_blacklisted:
        print("✓ Token successfully blacklisted")
        passed += 1
    else:
        print("✗ Token should be blacklisted")
        failed += 1
    
    # Test that blacklisted token can't be decoded
    payload_after_blacklist = JWTService.decode_access_token(token)
    if payload_after_blacklist is None:
        print("✓ Blacklisted token rejected on decode")
        passed += 1
    else:
        print("✗ Blacklisted token should be rejected")
        failed += 1
    
    # Test refresh token
    refresh_token = JWTService.create_refresh_token("test@example.com")
    if refresh_token:
        print("✓ Refresh token created successfully")
        passed += 1
    else:
        print("✗ Failed to create refresh token")
        failed += 1
    
    # Test refresh token decoding
    refresh_payload = JWTService.decode_refresh_token(refresh_token)
    if refresh_payload and refresh_payload.get("scope") == "refresh":
        print("✓ Refresh token decoded successfully")
        print(f"  - Scope: {refresh_payload.get('scope')}")
        passed += 1
    else:
        print("✗ Failed to decode refresh token")
        failed += 1
    
    print(f"\nJWT Service: {passed} passed, {failed} failed")
    return failed == 0


def test_decorators():
    """Test decorator imports"""
    print("\n" + "="*60)
    print("TESTING: Decorator Imports")
    print("="*60)
    
    passed = 0
    failed = 0
    
    try:
        from backend.auth.decorators import (
            token_required,
            admin_required,
            client_required,
            role_required,
            rate_limit,
            RateLimiter
        )
        print("✓ All decorators imported successfully")
        passed += 1
        
        # Test RateLimiter
        limiter = RateLimiter()
        if limiter.is_allowed("test_ip", 5, 60):
            print("✓ First request allowed")
            passed += 1
        else:
            print("✗ First request should be allowed")
            failed += 1
        
        # Make 4 more requests (total 5)
        for i in range(4):
            limiter.is_allowed("test_ip", 5, 60)
        
        # 6th request should be blocked
        if not limiter.is_allowed("test_ip", 5, 60):
            print("✓ Rate limit correctly enforced (6th request blocked)")
            passed += 1
        else:
            print("✗ 6th request should be blocked")
            failed += 1
        
    except Exception as e:
        print(f"✗ Failed to import decorators: {e}")
        failed += 1
    
    print(f"\nDecorators: {passed} passed, {failed} failed")
    return failed == 0


def test_file_structure():
    """Test that all files exist"""
    print("\n" + "="*60)
    print("TESTING: File Structure")
    print("="*60)
    
    files_to_check = [
        ("backend/main.py", "Main Flask app"),
        ("backend/auth/jwt.py", "JWT service with blacklist"),
        ("backend/auth/blueprints.py", "Updated auth routes"),
        ("backend/auth/decorators.py", "New decorators"),
        ("backend/auth/password_validation.py", "New password validation"),
    ]
    
    passed = 0
    failed = 0
    
    for file_path, description in files_to_check:
        full_path = Path(__file__).parent / file_path
        if full_path.exists():
            print(f"✓ {file_path} ({description})")
            passed += 1
        else:
            print(f"✗ {file_path} not found")
            failed += 1
    
    print(f"\nFile Structure: {passed} passed, {failed} failed")
    return failed == 0


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("AUTHENTICATION SECURITY TEST SUITE")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("Password Validation", test_password_validation()))
    results.append(("JWT Service", test_jwt_service()))
    results.append(("Decorators", test_decorators()))
    results.append(("File Structure", test_file_structure()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    all_passed = True
    for test_name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*60)
    if all_passed:
        print("✓ ALL TESTS PASSED")
        print("="*60)
        return 0
    else:
        print("✗ SOME TESTS FAILED")
        print("="*60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
