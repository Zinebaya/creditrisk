"""
Authentication decorators for securing API endpoints
Provides role-based access control, rate limiting, and token verification
Updated for multi-tenant architecture with super_admin, enterprise_admin, enterprise_user
"""

from functools import wraps
from datetime import datetime, timedelta
from collections import defaultdict
from flask import request, jsonify
from auth.jwt import JWTService
from utils.rbac import has_permission, Permission, is_super_admin, is_enterprise_admin


def _get_token_payload():
    """Extract and validate JWT from Authorization header using JWTService."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, "Missing or invalid token"
    token = auth_header.split(" ", 1)[1]
    payload = JWTService.decode_access_token(token)
    if not payload:
        return None, "Invalid or expired token"
    return payload, None


def token_required(f):
    """
    Decorator to verify JWT is valid and present.
    Protects endpoints that require authentication.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        payload, error = _get_token_payload()
        if error:
            return jsonify({"error": error}), 401
        return f(*args, **kwargs)
    return decorated_function


def role_required(required_role):
    """
    Generic role-based access control decorator.
    Supports both new and legacy role names.

    Usage:
        @role_required('super_admin')
        def super_admin_endpoint():
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            payload, error = _get_token_payload()
            if error:
                return jsonify({"error": error}), 401
            user_role = payload.get("role", "enterprise_user")
            
            # Support legacy role mapping
            role_map = {
                "admin": "super_admin",
                "client": "enterprise_admin",
                "client_user": "enterprise_user"
            }
            normalized_role = role_map.get(user_role, user_role)
            
            if normalized_role != required_role:
                return jsonify({"error": f"{required_role} access required"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def super_admin_required(f):
    """
    Decorator to ensure user has super_admin role.
    Protects sensitive platform administration endpoints.
    Supports legacy 'admin' role for backward compatibility.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        payload, error = _get_token_payload()
        if error:
            return jsonify({"error": error}), 401
        user_role = payload.get("role", "enterprise_user")
        
        if not is_super_admin(user_role):
            return jsonify({"error": "Super Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function


def enterprise_admin_required(f):
    """
    Decorator to ensure user is an enterprise administrator.
    Enterprise admins can manage their own enterprise and users.
    Supports both 'enterprise_admin' and legacy 'client' roles.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        payload, error = _get_token_payload()
        if error:
            return jsonify({"error": error}), 401
        user_role = payload.get("role", "enterprise_user")
        
        if not is_enterprise_admin(user_role):
            return jsonify({"error": "Enterprise Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function


def enterprise_access_required(f):
    """
    Decorator to ensure user has enterprise access (admin or regular user).
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        payload, error = _get_token_payload()
        if error:
            return jsonify({"error": error}), 401
        user_role = payload.get("role", "enterprise_user")
        
        # Allow enterprise_admin and enterprise_user roles
        if user_role not in ("enterprise_admin", "enterprise_user", "client", "client_user"):
            return jsonify({"error": "Enterprise access required"}), 403
        return f(*args, **kwargs)
    return decorated_function


def permission_required(permission: Permission):
    """
    Decorator to check if user has a specific permission.
    
    Usage:
        @permission_required(Permission.MANAGE_ENTERPRISES)
        def manage_enterprises():
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            payload, error = _get_token_payload()
            if error:
                return jsonify({"error": error}), 401
            user_role = payload.get("role", "enterprise_user")
            
            if not has_permission(user_role, permission):
                return jsonify({"error": f"Permission '{permission.value}' required"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# Legacy decorators for backward compatibility
def admin_required(f):
    """
    Deprecated: Use super_admin_required instead.
    Kept for backward compatibility.
    """
    return super_admin_required(f)


def client_required(f):
    """
    Decorator to ensure user has client role.
    Protects client-specific endpoints.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        payload, error = _get_token_payload()
        if error:
            return jsonify({"error": error}), 401
        user_role = payload.get("role", "client")
        if user_role not in ["client", "admin"]:
            return jsonify({"error": "Client access required"}), 403
        return f(*args, **kwargs)
    return decorated_function


class RateLimiter:
    """
    Simple in-memory rate limiter.
    Tracks requests per IP or user.
    """
    def __init__(self):
        self.requests = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Check if a key (IP/user) is within rate limit.

        Args:
            key: Identifier (IP address or user_id)
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            True if request is allowed, False if rate limited
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=window_seconds)

        # Remove old requests outside the window
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if req_time > cutoff
        ]

        # Check if under limit
        if len(self.requests[key]) < max_requests:
            self.requests[key].append(now)
            return True

        return False


_rate_limiter = RateLimiter()


def rate_limit(max_requests: int = 60, window_seconds: int = 60, key_func=None):
    """
    Rate limiting decorator.

    Usage:
        @rate_limit(max_requests=10, window_seconds=60)
        def login():
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Default to IP address, or use custom key function
            if key_func:
                key = str(key_func())
            else:
                key = request.remote_addr or "unknown"

            if not _rate_limiter.is_allowed(key, max_requests, window_seconds):
                return jsonify({
                    "error": f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds"
                }), 429

            return f(*args, **kwargs)
        return decorated_function
    return decorator
