#!/usr/bin/env python3
"""
Verify the fixes are in place
"""
import os
import re

def check_file_contains(filepath, pattern, description):
    """Check if a file contains a pattern"""
    if not os.path.exists(filepath):
        print(f"❌ {description}: FILE NOT FOUND")
        return False
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        if re.search(pattern, content, re.DOTALL | re.IGNORECASE):
            print(f"✅ {description}")
            return True
        else:
            print(f"❌ {description}: PATTERN NOT FOUND")
            return False

print("\n" + "="*70)
print("AUTHENTICATION FIXES VERIFICATION")
print("="*70)

checks = [
    # Fix 1: Auth blueprint registration
    ("api/app.py", r'from backend\.auth\.blueprints import auth_bp', 
     "✓ Fix 1a: Imported auth_bp in api/app.py"),
    ("api/app.py", r'app\.register_blueprint\(auth_bp.*url_prefix=["\']\/auth', 
     "✓ Fix 1b: Registered auth_bp at /auth prefix"),
    
    # Fix 2: Token format in api/blueprints.py
    ("api/blueprints.py", r'from auth\.jwt import JWTService',
     "✓ Fix 2a: Imported JWTService in api/blueprints.py"),
    ("api/blueprints.py", r'JWTService\.create_access_token\(email\)',
     "✓ Fix 2b: Using JWTService.create_access_token(email)"),
    
    # Fix 3: Response format
    ("api/blueprints.py", r'"token":\s*token,?\s*"user":\s*\{',
     "✓ Fix 3a: Response includes 'token' and 'user' keys"),
    ("api/blueprints.py", r'"id":\s*user\["id"\].*"email":\s*user\["email"\].*"role":\s*user\["role"\]',
     "✓ Fix 3b: User object includes id, email, role"),
    
    # Fix 4: Frontend logging
    ("frontend/contexts/auth-context.tsx", r'console\.log.*🔐.*Login attempt',
     "✓ Fix 4a: Auth context has login attempt logging"),
    ("frontend/contexts/auth-context.tsx", r'console\.log.*🚀.*Pushing to',
     "✓ Fix 4b: Auth context has redirect logging"),
    
    # Fix 5: API logging
    ("frontend/lib/api.ts", r'console\.log.*📡.*API.*method',
     "✓ Fix 5a: API client logs requests"),
    ("frontend/lib/api.ts", r'console\.log.*✅.*API.*Success',
     "✓ Fix 5b: API client logs successes"),
]

print("\nVerifying fixes...\n")
passed = 0
for filepath, pattern, desc in checks:
    if check_file_contains(filepath, pattern, desc):
        passed += 1

print("\n" + "="*70)
print(f"RESULTS: {passed}/{len(checks)} checks passed")
if passed == len(checks):
    print("✅ ALL FIXES VERIFIED - READY FOR TESTING")
else:
    print(f"⚠️  {len(checks) - passed} issues remaining")
print("="*70 + "\n")
