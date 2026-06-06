# Authentication Security Testing Guide

Quick reference for testing all authentication security features.

## Prerequisites

```bash
# 1. Navigate to project
cd c:\credit-risk

# 2. Install dependencies (if not already installed)
pip install -r requirements.txt

# 3. Start the backend
python backend/main.py
# Or: python -m flask run --app=backend.main:app

# Backend runs on: http://localhost:5000 (or http://localhost:8000)
```

## Test Scenarios

### 1. Strong Password Registration ✓

**Test:** Register with strong password that meets all requirements

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "strongpass@example.com",
    "password": "MySecure#Pass2024"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "message": "Registration successful",
  "user_id": 1,
  "email": "strongpass@example.com",
  "role": "client"
}
```

---

### 2. Weak Password Registration ✗

**Test:** Attempt to register with passwords that fail validation

#### 2a. Too short (< 8 characters)
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weakpass1@example.com",
    "password": "Short1!"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Password must be at least 8 characters long"
}
```

#### 2b. No uppercase letter
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weakpass2@example.com",
    "password": "nouppercase123!"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Password must contain at least 1 uppercase letter"
}
```

#### 2c. No number
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weakpass3@example.com",
    "password": "NoNumber!"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Password must contain at least 1 number"
}
```

#### 2d. No special character
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weakpass4@example.com",
    "password": "NoSpecialChar1"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Password must contain at least 1 special character"
}
```

---

### 3. Login Success ✓

**Test:** Login with correct credentials

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "strongpass@example.com",
    "password": "MySecure#Pass2024"
  }'
```

**Expected Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "strongpass@example.com",
    "role": "client",
    "is_active": true,
    "plan_tier": "free",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

---

### 4. Login Failure ✗

**Test:** Attempt login with wrong password

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "strongpass@example.com",
    "password": "WrongPassword123!"
  }'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid email or password"
}
```

---

### 5. Rate Limiting - Registration ⏱️

**Test:** Register more than 5 times in 5 minutes

```bash
# Requests 1-5: ALLOWED
for i in {1..5}; do
  curl -X POST http://localhost:5000/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"ratelimit$i@example.com\",
      \"password\": \"Secure#Pass$i\"
    }"
  echo ""
done

# Request 6: BLOCKED (within same 5-minute window)
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ratelimit6@example.com",
    "password": "Secure#Pass6"
  }'
```

**Expected Response on 6th request:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded. Max 5 requests per 300 seconds"
}
```

---

### 6. Rate Limiting - Login ⏱️

**Test:** Login more than 10 times in 5 minutes

```bash
# Requests 1-10: ALLOWED (quick succession)
for i in {1..10}; do
  curl -X POST http://localhost:5000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "strongpass@example.com",
      "password": "MySecure#Pass2024"
    }' > /dev/null
done

# Request 11: BLOCKED
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "strongpass@example.com",
    "password": "MySecure#Pass2024"
  }'
```

**Expected Response on 11th request:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded. Max 10 requests per 300 seconds"
}
```

---

### 7. Protected Route - Get User Info ✓

**Test:** Access protected endpoint with valid token

```bash
# First, login to get a token
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "strongpass@example.com",
    "password": "MySecure#Pass2024"
  }' | jq -r '.token')

# Then use the token to access /auth/me
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "strongpass@example.com",
    "role": "client",
    "is_active": true,
    "plan_tier": "free",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

---

### 8. Protected Route - Missing Token ✗

**Test:** Access protected endpoint without token

```bash
curl -X GET http://localhost:5000/auth/me
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Authorization required"
}
```

---

### 9. Protected Route - Invalid Token ✗

**Test:** Access protected endpoint with invalid token

```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid token"
}
```

---

### 10. Token Blacklist - Logout ✓

**Test:** Logout and verify token is blacklisted

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "strongpass@example.com",
    "password": "MySecure#Pass2024"
  }' | jq -r '.token')

# 2. Verify token works
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 OK with user info

# 3. Logout (blacklist the token)
curl -X POST http://localhost:5000/auth/logout \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 OK - "Logout successful"

# 4. Try to use the same token (should fail)
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Response: 401 Unauthorized - "Invalid or expired token"
```

**Key Test:** After logout, the same token cannot be used again. This verifies the token blacklist is working.

---

### 11. Refresh Token ✓

**Test:** Refresh an access token

```bash
# 1. Login to get tokens
RESPONSE=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "strongpass@example.com",
    "password": "MySecure#Pass2024"
  }')

REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')

# 2. Use refresh token to get new access token
curl -X POST http://localhost:5000/auth/refresh \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

**Expected Response:** `200 OK`
```json
{
  "token": "new-access-token...",
  "refresh_token": "new-refresh-token..."
}
```

---

### 12. Admin-Only Route ✓ / ✗

**Test:** Admin-only endpoint access control

```bash
# Login as admin (requires admin role in database)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminSecure#Pass2024"
  }' | jq -r '.token')

# Access admin endpoint with admin token
curl -X GET http://localhost:5000/auth/admins \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Response: 200 OK with list of admins

# Try with client token
CLIENT_TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "ClientSecure#Pass2024"
  }' | jq -r '.token')

curl -X GET http://localhost:5000/auth/admins \
  -H "Authorization: Bearer $CLIENT_TOKEN"
# Response: 403 Forbidden - "Admin access required"
```

---

## Password Validation Rules

A valid password MUST meet ALL requirements:

| Requirement | Example | Details |
|-------------|---------|---------|
| **Length** | Minimum 8 chars | `Secure#Pass123` ✓ |
| **Uppercase** | At least 1 A-Z | `Secure#Pass123` has 'S' ✓ |
| **Lowercase** | At least 1 a-z | `Secure#Pass123` has 'ecure' ✓ |
| **Number** | At least 1 (0-9) | `Secure#Pass123` has '123' ✓ |
| **Special** | At least 1 (!@#$% etc.) | `Secure#Pass123` has '#' ✓ |

**Valid Examples:**
- `MyPass#123`
- `Secure!Pass2024`
- `Complex$Pwd99`
- `SuperSecure@2024`

**Invalid Examples:**
- `short` (too short, missing requirements)
- `NoNumber!` (missing number)
- `nouppercase123!` (missing uppercase)
- `NOLOWERCASE123!` (missing lowercase)
- `NoSpecialChar123` (missing special character)

---

## Rate Limiting Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 5 requests | 5 minutes (300 seconds) |
| `/auth/login` | 10 requests | 5 minutes (300 seconds) |
| `/auth/admins` (POST) | 10 requests | 1 hour (3600 seconds) |
| Other endpoints | No limit | N/A |

**Note:** Limits are per IP address (by default).

---

## Token Expiration Times

| Token Type | Expires In | Use Case |
|-----------|-----------|----------|
| Access Token | 1 hour | API requests |
| Refresh Token | 7 days | Request new access token |

**Note:** Blacklisted tokens are immediately invalid, regardless of expiration time.

---

## Common curl Options

```bash
# Save response to variable
TOKEN=$(curl -s ... | jq -r '.token')

# Pretty print JSON response
curl ... | jq '.'

# Include response headers
curl -i ...

# Follow redirects
curl -L ...

# Verbose output (debug)
curl -v ...

# Custom headers
curl -H "Authorization: Bearer $TOKEN" ...

# POST with JSON
curl -X POST -H "Content-Type: application/json" -d '{"key": "value"}' ...
```

---

## Troubleshooting

### Token Expired
**Error:** `"Token has expired"`
**Solution:** Login again to get a fresh token

### Rate Limited
**Error:** `"Rate limit exceeded"`
**Solution:** Wait for the time window to pass (5 min for login/register)

### Invalid Token
**Error:** `"Invalid token"` or `"Authorization required"`
**Solution:** Ensure token is correctly formatted in Authorization header

### Password Weak
**Error:** `"Password must contain..."`
**Solution:** Ensure password meets all requirements

### User Not Found
**Error:** `"User not found"` (during login)
**Solution:** Register the user first

---

## Docker Testing (Optional)

If running in Docker:

```bash
# Build
docker build -t credit-risk-api .

# Run
docker run -p 5000:5000 credit-risk-api

# Test
curl http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Secure#Pass123"}'
```

---

## Performance Notes

- **Rate limiting:** Per-IP in-memory store (use Redis for distributed systems)
- **Token blacklist:** In-memory set (use Redis for distributed systems)
- **Password validation:** Regex-based (sub-millisecond)
- **JWT operations:** Standard library (fast)

For production with multiple servers, migrate to Redis:
- Token blacklist → Redis with TTL matching token expiration
- Rate limiting → Redis with INCR and EXPIRE

---

## Next Steps

1. ✓ Verify all tests pass in your environment
2. ✓ Update your frontend to handle rate limit (429) responses
3. ✓ Test with realistic load
4. ✓ Set strong JWT_SECRET in production
5. ✓ Configure Redis for distributed deployments
6. ✓ Monitor authentication logs
