"""
Auth Blueprint - Complete role-based JWT authentication system
Supports ADMIN and CLIENT roles with secure token management
"""

from flask import Blueprint, request, jsonify, current_app
from werkzeug.exceptions import BadRequest, Unauthorized
from auth.jwt import JWTService
from auth.decorators import token_required, admin_required, rate_limit
from auth.password_validation import validate_password_strength
from services.auth import AuthService
from services.db import DatabaseService
from utils.validation import parse_request_json
from config.config import settings
from services.logging_service import get_logger

logger = get_logger(__name__)
auth_bp = Blueprint("auth", __name__)


def get_db() -> DatabaseService:
    """Get database service - prefer app instance"""
    return current_app.db if hasattr(current_app, "db") else DatabaseService(settings.DATABASE_URL)


def json_error(error):
    """Format error response with appropriate status codes"""
    status = 401 if isinstance(error, Unauthorized) else 400 if isinstance(error, (BadRequest, ValueError)) else 500
    message = str(error) if isinstance(error, (BadRequest, ValueError, Unauthorized)) else f"Internal server error"
    return jsonify({"error": message}), status


def require_user():
    """Extract user from Authorization header"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Unauthorized("Missing or invalid token")

    token = auth_header.split(" ", 1)[1]
    payload = JWTService.decode_access_token(token)
    if not payload:
        raise Unauthorized("Invalid or expired token")

    user = get_db().get_user_by_email(payload["sub"])
    if not user:
        raise Unauthorized("User not found")

    return user


def require_admin():
    """Ensure user is admin"""
    user = require_user()
    if user.get("role") != "admin":
        raise Unauthorized("Admin access required")
    return user


# ============ PUBLIC ROUTES ============

@auth_bp.route("/register", methods=["POST"])
@rate_limit(max_requests=5, window_seconds=300)
def register():
    """Register new client user with password validation"""
    try:
        data = parse_request_json(request)
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            raise BadRequest("Email and password are required")

        # Validate email format
        if "@" not in email or "." not in email.split("@")[1]:
            raise BadRequest("Invalid email format")

        # Validate password strength
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            raise BadRequest(error_msg)

        if get_db().get_user_by_email(email):
            raise BadRequest("User already exists")

        password_hash = AuthService.hash_password(password)
        user = get_db().create_user(email, password_hash, "client", plan_tier="free", is_active=True)
        
        logger.info(f"New client registered: {email}")
        return jsonify({
            "message": "Registration successful",
            "user_id": user.get("id"),
            "email": email,
            "role": "client"
        }), 201
    except BadRequest as e:
        return json_error(e)
    except ValueError as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return json_error(e)


@auth_bp.route("/login", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=300)
def login():
    """Login and return JWT tokens"""
    try:
        data = parse_request_json(request)
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            raise BadRequest("Email and password are required")

        user = get_db().get_user_by_email(email)
        if not user or not AuthService.verify_password(password, user.get("password_hash", "")):
            raise Unauthorized("Invalid email or password")

        # Check if user account is active
        if not user.get("is_active", True):
            raise Unauthorized("Account is disabled. Contact your administrator.")

        # Create tokens with role and user_id in claims
        access_token = JWTService.create_access_token(user["email"], user["id"], user.get("role", "client"))
        refresh_token = JWTService.create_refresh_token(user["email"])

        logger.info(f"Login successful: {email} (role: {user.get('role', 'user')})")

        return jsonify({
            "token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.get("id"),
                "email": user.get("email"),
                "role": user.get("role", "user"),
                "is_active": user.get("is_active", True),
                "plan_tier": user.get("plan_tier", "free"),
                "created_at": user.get("created_at")
            }
        }), 200
    except (BadRequest, Unauthorized) as e:
        return json_error(e)
    except ValueError as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return json_error(e)


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """Refresh access token"""
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise Unauthorized("Missing or invalid refresh token")

        token = auth_header.split(" ", 1)[1]
        payload = JWTService.decode_refresh_token(token)
        if not payload:
            raise Unauthorized("Invalid or expired refresh token")

        user = get_db().get_user_by_email(payload["sub"])
        if not user:
            raise Unauthorized("User not found")

        # Rotate refresh token: blacklist the one presented and issue a new pair
        try:
            JWTService.blacklist_token(token)
        except Exception:
            logger.warning("Failed to blacklist used refresh token")

        access_token = JWTService.create_access_token(user["email"], user["id"], user.get("role", "client"))
        refresh_token = JWTService.create_refresh_token(user["email"])

        return jsonify({
            "token": access_token,
            "refresh_token": refresh_token
        }), 200
    except Unauthorized as e:
        return json_error(e)
    except ValueError as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Refresh error: {str(e)}")
        return json_error(e)


# ============ PROTECTED ROUTES ============

@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    """Get current user info"""
    try:
        return jsonify({"user": require_user()}), 200
    except Unauthorized as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return json_error(e)


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    """Logout by blacklisting the token"""
    try:
        user = require_user()

        # Blacklist access token (from Authorization header)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                JWTService.blacklist_token(token)
            except Exception:
                logger.warning("Failed to blacklist access token during logout")

        # Attempt to revoke refresh token if provided by client
        # Client may send refresh token in JSON body, X-Refresh-Token header, or cookie
        refresh_token = None
        try:
            body = request.get_json(silent=True) or {}
        except Exception:
            body = {}

        refresh_token = (
            body.get("refresh_token")
            or request.headers.get("X-Refresh-Token")
            or request.cookies.get("paypredict.refresh_token")
        )

        if refresh_token:
            try:
                JWTService.blacklist_token(refresh_token)
            except Exception:
                logger.warning("Failed to blacklist refresh token during logout")

        logger.info(f"Logout: {user.get('email')}")
        return jsonify({"message": "Logout successful"}), 200
    except Unauthorized as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return json_error(e)


# ============ ADMIN ROUTES ============

@auth_bp.route("/admins", methods=["GET"])
@admin_required
def list_admins():
    """List all admins"""
    try:
        require_admin()
        users = get_db().list_users()
        admins = [u for u in users if u.get("role") == "admin"]
        return jsonify({"admins": admins}), 200
    except Unauthorized as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"List admins error: {str(e)}")
        return json_error(e)


@auth_bp.route("/admins", methods=["POST"])
@admin_required
@rate_limit(max_requests=10, window_seconds=3600)
def create_admin():
    """Create new admin"""
    try:
        require_admin()
        data = parse_request_json(request)
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            raise BadRequest("Email and password are required")
        
        # Validate email format
        if "@" not in email or "." not in email.split("@")[1]:
            raise BadRequest("Invalid email format")

        # Validate password strength
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            raise BadRequest(error_msg)

        if get_db().get_user_by_email(email):
            raise BadRequest("User already exists")

        user = get_db().create_user(email, AuthService.hash_password(password), "admin")
        logger.info(f"New admin created: {email}")
        
        return jsonify({"user": user}), 201
    except (BadRequest, Unauthorized) as e:
        return json_error(e)
    except ValueError as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Create admin error: {str(e)}")
        return json_error(e)


@auth_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    """List all users (admin only)"""
    try:
        require_admin()
        users = get_db().list_users()
        return jsonify({"users": users}), 200
    except Unauthorized as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"List users error: {str(e)}")
        return json_error(e)


@auth_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@admin_required
def update_user_role(user_id: int):
    """Update user role"""
    try:
        require_admin()
        data = parse_request_json(request)
        role = data.get("role", "").strip().lower()

        if role not in ["admin", "client"]:
            raise BadRequest("Role must be 'admin' or 'client'")

        get_db().update_user_role(user_id, role)
        logger.info(f"User {user_id} role changed to {role}")
        
        return jsonify({"message": f"User role updated to {role}"}), 200
    except (BadRequest, Unauthorized) as e:
        return json_error(e)
    except ValueError as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Update role error: {str(e)}")
        return json_error(e)


@auth_bp.route("/users/<int:user_id>/plan", methods=["PUT"])
@admin_required
def update_user_plan(user_id: int):
    """Update user plan"""
    try:
        require_admin()
        data = parse_request_json(request)
        plan_tier = data.get("plan_tier", "").strip().lower()

        valid_plans = ["free", "pro", "enterprise", "unlimited"]
        if plan_tier not in valid_plans:
            raise BadRequest(f"Plan must be one of: {', '.join(valid_plans)}")

        get_db().update_user_plan(user_id, plan_tier)
        logger.info(f"User {user_id} plan changed to {plan_tier}")
        
        return jsonify({"message": f"User plan updated to {plan_tier}"}), 200
    except (BadRequest, Unauthorized) as e:
        return json_error(e)
    except ValueError as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Update plan error: {str(e)}")
        return json_error(e)


@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id: int):
    """Delete user"""
    try:
        admin_user = require_admin()
        
        if user_id == admin_user["id"]:
            raise BadRequest("Cannot delete your own account")

        get_db().delete_user(user_id)
        logger.info(f"User {user_id} deleted by admin")
        
        return jsonify({"message": "User deleted"}), 200
    except (BadRequest, Unauthorized) as e:
        return json_error(e)
    except ValueError as e:
        return json_error(e)
    except Exception as e:
        logger.error(f"Delete user error: {str(e)}")
        return json_error(e)
