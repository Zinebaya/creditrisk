"""
Super Admin routes - for management of platform and all enterprises
Handles viewing all enterprises, users, analytics, subscriptions, and sectors
Routes for super_admin role only
"""

from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden
from auth.jwt import JWTService
from services.db import DatabaseService
from auth.decorators import super_admin_required
from utils.validation import parse_request_json
from config.config import settings

superadmin_bp = Blueprint("superadmin", __name__, url_prefix="/api/superadmin")


def get_db_service() -> DatabaseService:
    return DatabaseService(settings.DATABASE_URL)


def require_auth():
    """Extract authenticated user from JWT"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Unauthorized("Missing or invalid token")
    payload = JWTService.decode_access_token(auth_header.split(" ", 1)[1])
    if not payload:
        raise Unauthorized("Invalid or expired token")
    return payload["sub"]


def error_response(e):
    status = 401 if isinstance(e, Unauthorized) else 403 if isinstance(e, Forbidden) else 400 if isinstance(e, (BadRequest, ValueError)) else 500
    msg = str(e) if isinstance(e, (BadRequest, ValueError, Unauthorized, Forbidden)) else "Internal server error"
    return jsonify({"error": msg}), status


# ==================== DASHBOARD & ANALYTICS ====================

@superadmin_bp.route("/dashboard", methods=["GET"])
@super_admin_required
def get_dashboard():
    """Get super admin dashboard with global stats"""
    try:
        require_auth()
        dbs = get_db_service()
        stats = dbs.get_admin_stats()
        return jsonify(stats), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/analytics", methods=["GET"])
@super_admin_required
def get_analytics():
    """Get global platform analytics"""
    try:
        require_auth()
        dbs = get_db_service()
        stats = dbs.get_admin_stats()
        return jsonify(stats), 200
    except Exception as e:
        return error_response(e)


# ==================== ENTERPRISE MANAGEMENT ====================

@superadmin_bp.route("/enterprises", methods=["GET"])
@super_admin_required
def list_enterprises():
    """Get list of all enterprises"""
    try:
        require_auth()
        dbs = get_db_service()
        enterprises = dbs.get_all_enterprises()
        return jsonify({"enterprises": enterprises}), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/enterprises/<int:enterprise_id>", methods=["GET"])
@super_admin_required
def get_enterprise(enterprise_id: int):
    """Get details of a specific enterprise"""
    try:
        require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_id(enterprise_id)
        if not user or user["role"] != "client":
            return jsonify({"error": "Enterprise not found"}), 404
        
        # Get additional stats for this enterprise
        clients_count = len(dbs.list_clients(owner_id=enterprise_id))
        predictions = dbs.get_user_predictions(enterprise_id, limit=1000)
        
        enterprise = {
            **user,
            "clients_count": clients_count,
            "predictions_count": len(predictions),
            "users_count": len(dbs.list_enterprise_users(enterprise_id)) + 1
        }
        return jsonify({"enterprise": enterprise}), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/enterprises/<int:enterprise_id>/toggle", methods=["POST"])
@super_admin_required
def toggle_enterprise_active(enterprise_id: int):
    """Toggle enterprise active/inactive status"""
    try:
        require_auth()
        dbs = get_db_service()
        result = dbs.toggle_user_active(enterprise_id)
        if not result:
            return jsonify({"error": "Enterprise not found"}), 404
        return jsonify({"enterprise": result}), 200
    except Exception as e:
        return error_response(e)


# ==================== USER MANAGEMENT ====================

@superadmin_bp.route("/users", methods=["GET"])
@super_admin_required
def list_all_users():
    """Get list of all users across all enterprises"""
    try:
        require_auth()
        dbs = get_db_service()
        users = dbs.list_users()
        return jsonify({"users": users}), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/users/<int:user_id>", methods=["GET"])
@super_admin_required
def get_user_details(user_id: int):
    """Get details of a specific user"""
    try:
        require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get additional info
        if user["role"] in ("client", "client_user"):
            predictions = dbs.get_user_predictions(user_id, limit=1000)
            user["predictions_count"] = len(predictions)
        
        return jsonify({"user": user}), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/users/<int:user_id>/toggle", methods=["POST"])
@super_admin_required
def toggle_user_status(user_id: int):
    """Toggle user active/inactive status"""
    try:
        require_auth()
        dbs = get_db_service()
        result = dbs.toggle_user_active(user_id)
        if not result:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": result}), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@super_admin_required
def update_user_role(user_id: int):
    """Update user role"""
    try:
        require_auth()
        data = parse_request_json(request)
        role = data.get("role")
        
        if not role:
            raise BadRequest("Role is required")
        
        if role not in ("admin", "client", "client_user", "super_admin", "enterprise_admin", "enterprise_user"):
            raise BadRequest("Invalid role")
        
        dbs = get_db_service()
        success = dbs.update_user_role(user_id, role)
        if not success:
            return jsonify({"error": "User not found"}), 404
        
        user = dbs.get_user_by_id(user_id)
        return jsonify({"user": user}), 200
    except Exception as e:
        return error_response(e)


# ==================== SUBSCRIPTIONS & PLANS ====================

@superadmin_bp.route("/subscriptions", methods=["GET"])
@super_admin_required
def list_subscriptions():
    """Get subscription statistics and list"""
    try:
        require_auth()
        dbs = get_db_service()
        users = dbs.list_users()
        
        # Group by subscription status
        subscriptions = {
            "free": [],
            "active": [],
            "expired": [],
            "canceled": []
        }
        
        for user in users:
            status = user.get("subscription_status", "free")
            if status in subscriptions:
                subscriptions[status].append({
                    "id": user["id"],
                    "email": user["email"],
                    "plan_tier": user.get("plan_tier", "free"),
                    "expires_at": user.get("subscription_expires_at")
                })
        
        total_by_plan = {}
        for user in users:
            plan = user.get("plan_tier", "free")
            total_by_plan[plan] = total_by_plan.get(plan, 0) + 1
        
        return jsonify({
            "subscriptions_by_status": subscriptions,
            "users_by_plan": total_by_plan,
            "total": len(users)
        }), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/users/<int:user_id>/subscription", methods=["PUT"])
@super_admin_required
def update_subscription(user_id: int):
    """Update user subscription"""
    try:
        require_auth()
        data = parse_request_json(request)
        dbs = get_db_service()
        
        success = dbs.update_user_subscription(
            user_id,
            subscription_status=data.get("subscription_status"),
            plan_tier=data.get("plan_tier"),
            stripe_customer_id=data.get("stripe_customer_id"),
            stripe_subscription_id=data.get("stripe_subscription_id"),
            subscription_expires_at=data.get("subscription_expires_at")
        )
        
        if not success:
            return jsonify({"error": "User not found"}), 404
        
        user = dbs.get_user_by_id(user_id)
        return jsonify({"user": user}), 200
    except Exception as e:
        return error_response(e)


# ==================== SECTORS ====================

@superadmin_bp.route("/sectors", methods=["GET"])
@super_admin_required
def list_sectors():
    """Get sector statistics"""
    try:
        require_auth()
        dbs = get_db_service()
        sector_stats = dbs.get_sector_stats()
        return jsonify(sector_stats), 200
    except Exception as e:
        return error_response(e)


# ==================== PREDICTIONS (Global view) ====================

@superadmin_bp.route("/predictions", methods=["GET"])
@super_admin_required
def list_all_predictions():
    """Get all predictions across the platform"""
    try:
        require_auth()
        limit = int(request.args.get("limit", 100))
        dbs = get_db_service()
        predictions = dbs.get_all_predictions(limit=limit)
        return jsonify({"predictions": predictions}), 200
    except Exception as e:
        return error_response(e)


@superadmin_bp.route("/logs", methods=["GET"])
@super_admin_required
def list_system_logs():
    """Get system logs"""
    try:
        require_auth()
        limit = int(request.args.get("limit", 50))
        dbs = get_db_service()
        logs = dbs.get_system_logs(limit=limit)
        return jsonify({"logs": logs}), 200
    except Exception as e:
        return error_response(e)
