import csv
import io
import json
from datetime import datetime
from typing import Dict

import pandas as pd
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import JWTManager, get_jwt, get_jwt_identity, jwt_required

from config.config import settings
from models.model_manager import ModelManager
from services.auth import AuthService
from services.db import DatabaseService
from services.validation import validate_batch_file, validate_prediction_input
from services.logging_service import get_logger
from auth.jwt import JWTService

hash_password = AuthService.hash_password
verify_password = AuthService.verify_password

logger = get_logger(__name__)

bp = Blueprint("api", __name__)
model_manager = ModelManager(settings.MODEL_PATH, settings.SCALER_PATH, settings.FEATURES_PATH)


def register_blueprints(app):
    app.register_blueprint(bp, url_prefix="/api")


def _current_user():
    claims = get_jwt()
    return {
        "user_id": claims.get("user_id") or get_jwt_identity(),
        "email": claims.get("sub") or claims.get("email"),
        "role": claims.get("role", "client"),
    }


def require_admin():
    user = _current_user()
    if user.get("role") != "admin":
        return None
    return user


def require_active_user():
    user = _current_user()
    if not user.get("user_id"):
        return None
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user or not db_user.get("is_active", True):
        return None
    return db_user


@bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})


@bp.route("/features", methods=["GET"])
@jwt_required()
def features():
    return jsonify({"selected_features": model_manager.selected_features})


@bp.route("/logs", methods=["GET"])
@jwt_required()
def logs():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "admin privileges required"}), 403

    logs = current_app.db.fetch_logs(limit=100)
    return jsonify({"logs": logs})


@bp.route("/clients", methods=["GET"])
@jwt_required()
def list_clients():
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user:
        return jsonify({"error": "User not found"}), 404

    owner_id = None
    if db_user["role"] in ["client", "client_user"]:
        owner_id = db_user.get("parent_id") if db_user.get("parent_id") else db_user["id"]
    elif db_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    clients = current_app.db.list_clients(owner_id=owner_id)
    return jsonify({"clients": clients}), 200


@bp.route("/clients", methods=["POST"])
@jwt_required()
def create_client():
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user:
        return jsonify({"error": "User not found"}), 404

    if db_user["role"] not in ["client", "client_user"]:
        return jsonify({"error": "Unauthorized"}), 403

    owner_id = db_user.get("parent_id") if db_user.get("parent_id") else db_user["id"]

    payload = request.get_json(force=True, silent=True) or {}
    client = current_app.db.create_client(payload, owner_id=owner_id)
    current_app.db.log_action("client_create", user.get("email"), {"client_id": client["id"], "email": client["email"]})
    return jsonify({"client": client}), 201


@bp.route("/clients/<int:client_id>", methods=["PUT"])
@jwt_required()
def update_client(client_id: int):
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user:
        return jsonify({"error": "User not found"}), 404

    if db_user["role"] not in ["client", "client_user"]:
        return jsonify({"error": "Unauthorized"}), 403

    owner_id = db_user.get("parent_id") if db_user.get("parent_id") else db_user["id"]
    payload = request.get_json(force=True, silent=True) or {}
    
    try:
        updated = current_app.db.update_client(client_id, payload, owner_id=owner_id)
        if not updated:
            return jsonify({"error": "Client not found"}), 404
        current_app.db.log_action("client_update", user.get("email"), {"client_id": client_id})
        return jsonify({"client": updated}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 403


@bp.route("/clients/<int:client_id>", methods=["DELETE"])
@jwt_required()
def delete_client(client_id: int):
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user:
        return jsonify({"error": "User not found"}), 404

    if db_user["role"] not in ["client", "client_user"]:
        return jsonify({"error": "Unauthorized"}), 403

    owner_id = db_user.get("parent_id") if db_user.get("parent_id") else db_user["id"]
    clients = current_app.db.list_clients(owner_id=owner_id)
    if not any(c["id"] == client_id for c in clients):
        return jsonify({"error": "Client not found or unauthorized"}), 404

    try:
        current_app.db.delete_client(client_id)
        current_app.db.log_action("client_delete", user.get("email"), {"client_id": client_id})
        return jsonify({"ok": True}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404


@bp.route("/admin/stats", methods=["GET"])
@jwt_required()
def admin_stats():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "admin privileges required"}), 403
    stats = current_app.db.fetch_admin_stats()
    return jsonify(stats), 200


@bp.route("/admin/predictions", methods=["GET"])
@jwt_required()
def admin_predictions():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "admin privileges required"}), 403

    limit = int(request.args.get("limit", 100))
    predictions = current_app.db.fetch_predictions(limit=limit, include_user_email=True)
    return jsonify({"predictions": predictions}), 200


@bp.route("/admin/users/<int:user_id>/toggle-active", methods=["PUT"])
@jwt_required()
def admin_toggle_user_active(user_id: int):
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "admin privileges required"}), 403

    updated = current_app.db.toggle_user_active(user_id)
    current_app.db.log_action("user_toggle_active", user.get("email"), {"target_user_id": user_id, "is_active": updated["is_active"]})
    return jsonify({"user": updated}), 200


@bp.route("/admin/users/<int:user_id>/predictions", methods=["GET"])
@jwt_required()
def admin_user_predictions(user_id: int):
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "admin privileges required"}), 403

    predictions = current_app.db.fetch_predictions(user_id=user_id, limit=100, include_user_email=True)
    return jsonify({"predictions": predictions}), 200


@bp.route("/admin/logs", methods=["GET"])
@jwt_required()
def admin_logs():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "admin privileges required"}), 403

    limit = int(request.args.get("limit", 100))
    logs = current_app.db.fetch_logs(limit=limit)
    return jsonify({"logs": logs}), 200


@bp.route("/auth/register", methods=["POST"])
def register():
    payload = request.get_json(force=True, silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")
    role = payload.get("role", "user")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    existing = current_app.db.get_user_by_email(email)
    if existing:
        return jsonify({"error": "user already exists"}), 400

    password_hash = hash_password(password)
    user = current_app.db.create_user(email, password_hash, role)
    current_app.db.log_action("register", email, {"email": email})
    return jsonify({"user_id": user.get("id"), "email": email, "role": role}), 201


@bp.route("/auth/login", methods=["POST"])
def login():
    payload = request.get_json(force=True, silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = current_app.db.get_user_by_email(email)
    if not user or not verify_password(password, user.get("password_hash", "")):
        return jsonify({"error": "invalid credentials"}), 401

    if not user.get("is_active", True):
        return jsonify({"error": "account disabled"}), 403

    token = JWTService.create_access_token(user["email"], user["id"], user.get("role", "client"))
    current_app.db.log_action("login", email, {"email": email})
    
    # Return token and user object matching frontend expectations
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "plan_tier": user.get("plan_tier", "free"),
            "is_active": user.get("is_active", True),
        }
    }), 200


@bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    payload = request.get_json(force=True, silent=True) or {}
    email = payload.get("email")

    if not email:
        return jsonify({"error": "email is required"}), 400

    user = current_app.db.get_user_by_email(email)
    if user:
        current_app.db.log_action("forgot_password", email, {"email": email})

    return jsonify({"message": "If an account exists, reset instructions have been sent to the email address."})


@bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    payload = request.get_json(force=True, silent=True)
    if not payload:
        return jsonify({"error": "JSON body required"}), 400

    error = validate_prediction_input(payload, model_manager.selected_features)
    if error:
        return jsonify({"error": error}), 400

    cache_key = model_manager.cache_key(payload)
    cached = current_app.cache.get(cache_key)
    if cached:
        result = json.loads(cached)
        result["cached"] = True
        logger.info("cache_hit", extra={"user": _current_user(), "input": payload})
    else:
        result = model_manager.predict(payload)
        current_app.cache.set(cache_key, json.dumps(result), settings.CACHE_TTL_SECONDS)

    active_user = require_active_user()
    if not active_user:
        return jsonify({"error": "User account inactive or invalid"}), 403

    user_id = int(active_user["id"])
    plan_tier = active_user.get("plan_tier", "free")
    usage = current_app.db.fetch_predictions(user_id=user_id, limit=None)
    used = len(usage) if usage else 0
    limits = {
        "free": 3,
        "pro": None,
        "enterprise": None,
        "unlimited": None,
    }
    limit = limits.get(plan_tier, 3)
    if limit is not None and used >= limit:
        return jsonify({"error": "Free plan limit reached. Upgrade to continue."}), 402

    current_app.db.log_prediction(
        user_id=user_id,
        input_json=payload,
        prediction=result["risk"],
        probability=result["probability"],
        decision=result["decision"],
    )
    logger.info("prediction", extra={"user": active_user, "result": result})
    return jsonify(result)


def make_json_serializable(val):
    if isinstance(val, dict):
        return {k: make_json_serializable(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [make_json_serializable(x) for x in val]
    elif hasattr(val, "item"):
        return val.item()
    return val


@bp.route("/batch_predict", methods=["POST"])
@jwt_required()
def batch_predict():
    if "file" not in request.files:
        return jsonify({"error": "file upload required"}), 400

    file = request.files["file"]
    try:
        file_bytes = file.read()
        validation = validate_batch_file(file.filename, file_bytes, model_manager.selected_features)
        if validation["error"]:
            return jsonify({"error": validation["error"]}), 400

        df = validation["dataframe"]
        predictions = model_manager.batch_predict(df)
        output = []
        for row, pred in zip(df.to_dict(orient="records"), predictions):
            row.update(pred)
            serializable_row = make_json_serializable(row)
            output.append(serializable_row)
            current_app.db.log_prediction(
                user_id=int(_current_user().get("user_id")) if _current_user().get("user_id") else None,
                input_json=serializable_row,
                prediction=pred["risk"],
                probability=pred["probability"],
                decision=pred["decision"],
            )

        logger.info("batch_prediction", extra={"user": _current_user(), "rows": len(output)})
        return jsonify({"predictions": output, "count": len(output)})
    except Exception as exc:
        logger.error("batch_predict_error", exc_info=True)
        return jsonify({"error": str(exc)}), 500


@bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    limit = int(request.args.get("limit", 100))
    predictions = current_app.db.fetch_predictions(
        user_id=int(_current_user().get("user_id")) if _current_user().get("user_id") else None,
        limit=limit,
    )
    return jsonify({"predictions": predictions})


@bp.route("/analytics", methods=["GET"])
@jwt_required()
def analytics():
    user = _current_user()
    if user.get("role") == "admin":
        stats = current_app.db.fetch_analytics()
    else:
        stats = current_app.db.fetch_analytics(user_id=int(user.get("user_id")))
    return jsonify(stats)


@bp.route("/usage", methods=["GET"])
@jwt_required()
def usage():
    """Get current user's prediction usage quota"""
    try:
        active_user = require_active_user()
        if not active_user:
            return jsonify({"error": "User account inactive or invalid"}), 403

        plan_tier = active_user.get("plan_tier", "free")
        predictions = current_app.db.fetch_predictions(user_id=int(active_user["id"]), limit=None)
        used = len(predictions) if predictions else 0

        limits = {
            "free": 3,
            "pro": None,
            "enterprise": None,
            "unlimited": None,
        }

        limit = limits.get(plan_tier, 3)
        remaining = limit - used if limit is not None else None

        return jsonify({
            "plan_tier": plan_tier,
            "used": used,
            "limit": limit,
            "remaining": remaining,
            "limit_reached": limit is not None and used >= limit,
            "subscription_status": "active",
        }), 200
    except Exception as e:
        logger.error(f"Usage error: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== ENTERPRISE USER MANAGEMENT ====================

@bp.route("/enterprise/users", methods=["GET"])
@jwt_required()
def list_enterprise_users():
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user or db_user["role"] != "client":
        return jsonify({"error": "Enterprise admin privileges required"}), 403

    users = current_app.db.list_enterprise_users(parent_id=db_user["id"])
    return jsonify({"users": users}), 200


@bp.route("/enterprise/users", methods=["POST"])
@jwt_required()
def create_enterprise_user():
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user or db_user["role"] != "client":
        return jsonify({"error": "Enterprise admin privileges required"}), 403

    payload = request.get_json(force=True, silent=True) or {}
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    first_name = payload.get("first_name", "")
    last_name = payload.get("last_name", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if current_app.db.get_user_by_email(email):
        return jsonify({"error": "User already exists"}), 400

    password_hash = AuthService.hash_password(password)
    created = current_app.db.create_enterprise_user(
        email=email,
        password_hash=password_hash,
        parent_id=db_user["id"],
        first_name=first_name,
        last_name=last_name
    )
    return jsonify({"user": created}), 201


@bp.route("/enterprise/users/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_enterprise_user(user_id: int):
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user or db_user["role"] != "client":
        return jsonify({"error": "Enterprise admin privileges required"}), 403

    payload = request.get_json(force=True, silent=True) or {}
    updated = current_app.db.update_enterprise_user(user_id=user_id, parent_id=db_user["id"], data=payload)
    if not updated:
        return jsonify({"error": "User not found or unauthorized"}), 404
    return jsonify({"user": updated}), 200


@bp.route("/enterprise/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_enterprise_user(user_id: int):
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user or db_user["role"] != "client":
        return jsonify({"error": "Enterprise admin privileges required"}), 403

    # Check if user belongs to this enterprise
    target = current_app.db.get_user_by_id(user_id)
    if not target or target.get("parent_id") != db_user["id"]:
        return jsonify({"error": "User not found or unauthorized"}), 404

    current_app.db.delete_user(user_id)
    return jsonify({"ok": True}), 200


@bp.route("/enterprise/users/<int:user_id>/reset-password", methods=["POST"])
@jwt_required()
def reset_enterprise_user_password(user_id: int):
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user or db_user["role"] != "client":
        return jsonify({"error": "Enterprise admin privileges required"}), 403

    payload = request.get_json(force=True, silent=True) or {}
    password = payload.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400

    password_hash = AuthService.hash_password(password)
    ok = current_app.db.reset_enterprise_user_password(user_id=user_id, parent_id=db_user["id"], new_password_hash=password_hash)
    if not ok:
        return jsonify({"error": "User not found or unauthorized"}), 404
    return jsonify({"ok": True}), 200


# ==================== ENTERPRISE PROFILE ====================

@bp.route("/enterprise/profile", methods=["GET"])
@jwt_required()
def get_enterprise_profile():
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"profile": db_user}), 200


@bp.route("/enterprise/profile", methods=["PUT"])
@jwt_required()
def update_enterprise_profile():
    user = _current_user()
    db_user = current_app.db.get_user_by_id(int(user["user_id"]))
    if not db_user:
        return jsonify({"error": "User not found"}), 404

    payload = request.get_json(force=True, silent=True) or {}
    
    # Handle password change
    if "password" in payload and payload["password"]:
        payload["password_hash"] = AuthService.hash_password(payload["password"])

    updated = current_app.db.update_enterprise_profile(user_id=db_user["id"], data=payload)
    return jsonify({"profile": updated}), 200


# ==================== SUPER ADMIN EXTRAS ====================

@bp.route("/superadmin/companies", methods=["GET"])
@jwt_required()
def superadmin_companies():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "Super Admin privileges required"}), 403

    # All users with role == 'client' are enterprise admins (companies)
    users = current_app.db.list_users()
    companies = [u for u in users if u.get("role") == "client"]
    
    # Enrich with predicted counts and users counts
    enriched = []
    for c in companies:
        c_preds = current_app.db.fetch_predictions(user_id=c["id"], limit=None)
        c_users = current_app.db.list_enterprise_users(parent_id=c["id"])
        enriched.append({
            **c,
            "predictions_count": len(c_preds) if c_preds else 0,
            "users_count": len(c_users) if c_users else 0
        })
    return jsonify({"companies": enriched}), 200


@bp.route("/superadmin/users", methods=["GET"])
@jwt_required()
def superadmin_users():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "Super Admin privileges required"}), 403

    users = current_app.db.list_users()
    
    # Enrich with parent company name if available
    enriched = []
    for u in users:
        parent_name = ""
        if u.get("parent_id"):
            parent = current_app.db.get_user_by_id(u["parent_id"])
            if parent:
                parent_name = parent.get("company_name") or parent.get("email")
        enriched.append({
            **u,
            "company_name": parent_name or u.get("company_name") or ""
        })
    return jsonify({"users": enriched}), 200


@bp.route("/superadmin/sectors", methods=["GET"])
@jwt_required()
def superadmin_sectors():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "Super Admin privileges required"}), 403

    # Categorize companies by sector
    users = current_app.db.list_users()
    companies = [u for u in users if u.get("role") == "client"]
    
    sectors = {
        "banques": {"companies": 0, "clients": 0, "predictions": 0},
        "organismes de crédit": {"companies": 0, "clients": 0, "predictions": 0},
        "sociétés de financement": {"companies": 0, "clients": 0, "predictions": 0},
        "autres": {"companies": 0, "clients": 0, "predictions": 0}
    }
    
    for c in companies:
        sector_key = "autres"
        sector_str = str(c.get("company_sector") or "").lower().strip()
        if "banque" in sector_str:
            sector_key = "banques"
        elif "credit" in sector_str or "crédit" in sector_str or "organisme" in sector_str:
            sector_key = "organismes de crédit"
        elif "finance" in sector_str or "financement" in sector_str:
            sector_key = "sociétés de financement"
            
        sectors[sector_key]["companies"] += 1
        
        # Clients owned by this company
        c_clients = current_app.db.list_clients(owner_id=c["id"])
        sectors[sector_key]["clients"] += len(c_clients) if c_clients else 0
        
        # Predictions made by this company
        c_preds = current_app.db.fetch_predictions(user_id=c["id"], limit=None)
        sectors[sector_key]["predictions"] += len(c_preds) if c_preds else 0
        
    return jsonify({"sectors": sectors}), 200


@bp.route("/superadmin/analytics", methods=["GET"])
@jwt_required()
def superadmin_analytics():
    user = _current_user()
    if user.get("role") != "admin":
        return jsonify({"error": "Super Admin privileges required"}), 403

    users = current_app.db.list_users()
    predictions = current_app.db.fetch_predictions(limit=None)
    companies = [u for u in users if u.get("role") == "client"]
    
    total_revenue = 0
    pro_count = 0
    ent_count = 0
    for c in companies:
        if c.get("plan_tier") == "pro":
            total_revenue += 500
            pro_count += 1
        elif c.get("plan_tier") == "enterprise":
            total_revenue += 5000
            ent_count += 1
            
    return jsonify({
        "total_companies": len(companies),
        "total_users": len(users),
        "total_predictions": len(predictions) if predictions else 0,
        "revenue": total_revenue,
        "growth": "+12.4%",
        "plan_usage": {
            "free": len([c for c in companies if c.get("plan_tier") == "free"]),
            "pro": pro_count,
            "enterprise": ent_count
        }
    }), 200
