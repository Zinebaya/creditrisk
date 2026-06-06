"""
Enterprise Admin routes - for management of company and users
Handles CRUD operations for clients, users, predictions, and company profile
Routes for enterprise_admin and enterprise_user roles
"""

from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden
from auth.jwt import JWTService
from services.db import DatabaseService
from services.ml_service import MLModelService
from auth.decorators import enterprise_admin_required, enterprise_access_required
from utils.validation import parse_request_json, validate_phone_format
from utils.wilayas import is_valid_wilaya
from config.config import settings
import numpy as np

enterprise_bp = Blueprint("enterprise", __name__, url_prefix="/api/enterprise")


def get_db_service() -> DatabaseService:
    return DatabaseService(settings.DATABASE_URL)


def get_ml_service() -> MLModelService:
    return MLModelService()


def require_auth():
    """Extract authenticated user from JWT"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Unauthorized("Missing or invalid token")
    payload = JWTService.decode_access_token(auth_header.split(" ", 1)[1])
    if not payload:
        raise Unauthorized("Invalid or expired token")
    return payload["sub"]


def get_enterprise_id(user: dict) -> int:
    """Get the enterprise root ID for multi-tenancy"""
    return user.get("parent_id") or user.get("id")


def error_response(e):
    status = 401 if isinstance(e, Unauthorized) else 403 if isinstance(e, Forbidden) else 400 if isinstance(e, (BadRequest, ValueError)) else 500
    msg = str(e) if isinstance(e, (BadRequest, ValueError, Unauthorized, Forbidden)) else "Internal server error"
    return jsonify({"error": msg}), status


# ==================== CLIENT FINAL MANAGEMENT ====================

@enterprise_bp.route("/clients", methods=["GET"])
@enterprise_access_required
def list_enterprise_clients():
    """Get all clients for this enterprise"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        enterprise_id = get_enterprise_id(user)
        clients = dbs.list_clients(owner_id=enterprise_id)
        return jsonify({"clients": clients}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/clients", methods=["POST"])
@enterprise_access_required
def create_enterprise_client():
    """Create a new client for this enterprise"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        data = parse_request_json(request)
        for field in ["name", "email", "phone", "wilaya", "city"]:
            if not str(data.get(field, "")).strip():
                raise BadRequest(f"{field.capitalize()} is required")
        
        if not validate_phone_format(data["phone"]):
            raise BadRequest("Invalid phone number format")
        
        if not is_valid_wilaya(data.get("wilaya")):
            raise BadRequest("Invalid wilaya")
        
        enterprise_id = get_enterprise_id(user)
        client_data = {
            "name": str(data.get("name", "")).strip(),
            "first_name": str(data.get("first_name", "")).strip() or None,
            "gender": str(data.get("gender", "")).strip() or None,
            "email": str(data.get("email", "")).strip(),
            "phone": str(data.get("phone", "")).strip(),
            "address": str(data.get("address", "")).strip() or None,
            "wilaya": str(data.get("wilaya", "")).strip(),
            "city": str(data.get("city", "")).strip(),
            "sector": str(data.get("sector", "")).strip() or None,
            "repayment_status": str(data.get("repayment_status", "en_cours")).strip(),
            "notes": str(data.get("notes", "")).strip() or None,
        }
        
        client = dbs.create_client(client_data, owner_id=enterprise_id)
        return jsonify({"client": client}), 201
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/clients/<int:client_id>", methods=["GET"])
@enterprise_access_required
def get_enterprise_client(client_id: int):
    """Get a specific client details"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        enterprise_id = get_enterprise_id(user)
        clients = dbs.list_clients(owner_id=enterprise_id)
        client = next((c for c in clients if c["id"] == client_id), None)
        if not client:
            return jsonify({"error": "Client not found"}), 404
        
        return jsonify({"client": client}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/clients/<int:client_id>", methods=["PUT"])
@enterprise_access_required
def update_enterprise_client(client_id: int):
    """Update a client"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        data = parse_request_json(request)
        enterprise_id = get_enterprise_id(user)
        
        payload = {}
        for field in ["name", "first_name", "gender", "email", "phone", "address", "wilaya", "city", "sector", "repayment_status", "notes"]:
            if field in data:
                value = str(data[field]).strip() if data[field] is not None else None
                if field == "phone" and value and not validate_phone_format(value):
                    raise BadRequest("Invalid phone number format")
                if field == "wilaya" and value and not is_valid_wilaya(value):
                    raise BadRequest("Invalid wilaya")
                payload[field] = value
        
        result = dbs.update_client(client_id, payload, owner_id=enterprise_id)
        if not result:
            return jsonify({"error": "Client not found or access denied"}), 404
        return jsonify({"client": result}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/clients/<int:client_id>", methods=["DELETE"])
@enterprise_access_required
def delete_enterprise_client(client_id: int):
    """Delete a client"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        enterprise_id = get_enterprise_id(user)
        dbs.delete_client(client_id, owner_id=enterprise_id)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return error_response(e)


# ==================== PREDICTION MANAGEMENT ====================

@enterprise_bp.route("/predict", methods=["POST"])
@enterprise_access_required
def create_prediction():
    """Create a prediction for a client"""
    try:
        user_email = require_auth()
        data = parse_request_json(request)
        
        # Validate client_id is provided
        client_id = data.get("client_id")
        if not client_id:
            raise BadRequest("client_id is required")
        
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        # Verify client belongs to this enterprise
        enterprise_id = get_enterprise_id(user)
        clients = dbs.list_clients(owner_id=enterprise_id)
        if not any(c["id"] == client_id for c in clients):
            raise Forbidden("Client not found in your enterprise")
        
        # Check prediction limit
        limit_check = dbs.check_prediction_limit(user["id"])
        if not limit_check["allowed"]:
            return jsonify({
                "error": "Prediction limit reached",
                "message": "You have reached your monthly prediction limit",
                "used": limit_check["used"],
                "limit": limit_check["limit"],
                "upgrade_prompt": True
            }), 429
        
        # Prepare features for ML model
        ml = get_ml_service()
        if ml.model is None or ml.scaler is None:
            raise RuntimeError("ML model not loaded")
        
        feature_vector = []
        for feat in ml.features:
            value = data.get(feat, 0)
            try:
                feature_vector.append(float(value or 0))
            except (ValueError, TypeError):
                raise BadRequest(f"Invalid value for feature {feat}")
        
        # Make prediction
        scaled = ml.scaler.transform([feature_vector])
        proba = ml.model.predict_proba(scaled)[0]
        probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
        classification = "high_risk" if probability >= 0.5 else "low_risk"
        decision = "decline" if classification == "high_risk" else "approve"
        
        # Save prediction
        input_data = {feat: feature_vector[i] for i, feat in enumerate(ml.features)}
        input_data["client_id"] = client_id
        
        dbs.create_prediction(
            user["id"],
            input_data,
            classification,
            probability,
            decision,
            {},
            client_id=client_id
        )
        
        dbs.track_prediction(user["id"])
        
        return jsonify({
            "prediction": classification,
            "probability": round(probability, 6),
            "decision": decision,
            "client_id": client_id
        }), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/predictions", methods=["GET"])
@enterprise_access_required
def list_predictions():
    """Get all predictions for this enterprise"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        limit = int(request.args.get("limit", 100))
        predictions = dbs.get_predictions(user_id=user["id"], limit=limit)
        return jsonify({"predictions": predictions}), 200
    except Exception as e:
        return error_response(e)


# ==================== PROFILE MANAGEMENT ====================

@enterprise_bp.route("/profile", methods=["GET"])
@enterprise_access_required
def get_profile():
    """Get enterprise profile"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        profile = {
            "id": user["id"],
            "email": user["email"],
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "phone": user.get("phone"),
            "wilaya": user.get("wilaya"),
            "address": user.get("address"),
            "photo_url": user.get("photo_url"),
            "company_name": user.get("company_name"),
            "company_sector": user.get("company_sector"),
            "created_at": user.get("created_at")
        }
        return jsonify({"profile": profile}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/profile", methods=["PUT"])
@enterprise_admin_required
def update_profile():
    """Update enterprise admin profile"""
    try:
        user_email = require_auth()
        data = parse_request_json(request)
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        update_data = {}
        for field in ["first_name", "last_name", "phone", "wilaya", "address", "photo_url", "company_name", "company_sector"]:
            if field in data:
                update_data[field] = data[field]
        
        if "phone" in update_data and update_data["phone"] and not validate_phone_format(update_data["phone"]):
            raise BadRequest("Invalid phone number format")
        
        if "wilaya" in update_data and update_data["wilaya"] and not is_valid_wilaya(update_data["wilaya"]):
            raise BadRequest("Invalid wilaya")
        
        profile = dbs.update_enterprise_profile(user["id"], update_data)
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        
        return jsonify({"profile": profile}), 200
    except Exception as e:
        return error_response(e)


# ==================== USER MANAGEMENT (Enterprise Admin only) ====================

@enterprise_bp.route("/users", methods=["GET"])
@enterprise_admin_required
def list_enterprise_users():
    """List all users in this enterprise"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        users = dbs.list_enterprise_users(user["id"])
        return jsonify({"users": users}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/users", methods=["POST"])
@enterprise_admin_required
def create_enterprise_user():
    """Create a new user in this enterprise"""
    try:
        user_email = require_auth()
        data = parse_request_json(request)
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        
        if not email or not password:
            raise BadRequest("Email and password are required")
        
        from services.auth import AuthService
        password_hash = AuthService.hash_password(password)
        
        new_user = dbs.create_enterprise_user(
            email,
            password_hash,
            user["id"],
            first_name or None,
            last_name or None
        )
        return jsonify({"user": new_user}), 201
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/users/<int:user_id>", methods=["PUT"])
@enterprise_admin_required
def update_enterprise_user(user_id: int):
    """Update a user in this enterprise"""
    try:
        user_email = require_auth()
        data = parse_request_json(request)
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        result = dbs.update_enterprise_user(user_id, user["id"], data)
        if not result:
            return jsonify({"error": "User not found or access denied"}), 404
        
        return jsonify({"user": result}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/users/<int:user_id>/toggle", methods=["POST"])
@enterprise_admin_required
def toggle_user_active(user_id: int):
    """Toggle user active/inactive"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        result = dbs.toggle_enterprise_user_active(user_id, user["id"])
        if not result:
            return jsonify({"error": "User not found or access denied"}), 404
        
        return jsonify({"user": result}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/users/<int:user_id>/reset-password", methods=["POST"])
@enterprise_admin_required
def reset_user_password(user_id: int):
    """Reset user password"""
    try:
        user_email = require_auth()
        data = parse_request_json(request)
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        new_password = data.get("password", "")
        if not new_password:
            raise BadRequest("New password is required")
        
        from services.auth import AuthService
        password_hash = AuthService.hash_password(new_password)
        
        success = dbs.reset_enterprise_user_password(user_id, user["id"], password_hash)
        if not success:
            return jsonify({"error": "User not found or access denied"}), 404
        
        return jsonify({"ok": True}), 200
    except Exception as e:
        return error_response(e)


# ==================== REPAYMENT TRACKING ====================

from datetime import datetime

@enterprise_bp.route("/repayments/summary", methods=["GET"])
@enterprise_access_required
def get_repayment_summary():
    """Get repayment summary for this enterprise"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        enterprise_id = get_enterprise_id(user)
        
        # Get summary from database
        with dbs.session() as s:
            from services.repayment_service import RepaymentService
            summary = RepaymentService.get_repayment_summary(s, enterprise_id)
        
        return jsonify(summary), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/repayments", methods=["GET"])
@enterprise_access_required
def list_repayments():
    """Get all repayments for this enterprise"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        enterprise_id = get_enterprise_id(user)
        status = request.args.get("status")
        
        with dbs.session() as s:
            from models import Repayment, Client
            from sqlalchemy import select
            
            if status:
                repayments = s.execute(
                    select(Repayment)
                    .join(Client, Repayment.client_id == Client.id)
                    .filter(Client.owner_id == enterprise_id)
                    .filter(Repayment.status == status)
                    .order_by(Repayment.created_at.desc())
                ).scalars().all()
            else:
                repayments = s.execute(
                    select(Repayment)
                    .join(Client, Repayment.client_id == Client.id)
                    .filter(Client.owner_id == enterprise_id)
                    .order_by(Repayment.created_at.desc())
                ).scalars().all()
            
            from services.repayment_service import RepaymentService
            result = [RepaymentService._to_dict(r) for r in repayments]
        
        return jsonify({"repayments": result}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/repayments/client/<int:client_id>", methods=["GET"])
@enterprise_access_required
def get_client_repayments(client_id: int):
    """Get all repayments for a specific client"""
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        enterprise_id = get_enterprise_id(user)
        
        # Verify client belongs to enterprise
        clients = dbs.list_clients(owner_id=enterprise_id)
        if not any(c["id"] == client_id for c in clients):
            raise Forbidden("Client not found in your enterprise")
        
        with dbs.session() as s:
            from models import Repayment
            from sqlalchemy import select
            
            repayments = s.execute(
                select(Repayment)
                .filter_by(client_id=client_id)
                .order_by(Repayment.created_at.desc())
            ).scalars().all()
            
            from services.repayment_service import RepaymentService
            result = [RepaymentService._to_dict(r) for r in repayments]
        
        return jsonify({"repayments": result}), 200
    except Exception as e:
        return error_response(e)


@enterprise_bp.route("/repayments/<int:repayment_id>", methods=["PUT"])
@enterprise_admin_required
def update_repayment(repayment_id: int):
    """Update repayment status or record payment"""
    try:
        user_email = require_auth()
        data = parse_request_json(request)
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            raise Unauthorized("User not found")
        
        enterprise_id = get_enterprise_id(user)
        
        with dbs.session() as s:
            from models import Repayment, Client
            from sqlalchemy import select
            
            # Verify repayment belongs to enterprise
            repayment = s.get(Repayment, repayment_id)
            if not repayment:
                return jsonify({"error": "Repayment not found"}), 404
            
            client = s.get(Client, repayment.client_id)
            if not client or client.owner_id != enterprise_id:
                raise Forbidden("Access denied")
            
            # Update status
            if "status" in data:
                status = data["status"]
                if status not in ["remboursé", "en_cours", "en_retard", "impayé"]:
                    raise BadRequest("Invalid status")
                repayment.status = status
            
            # Record payment
            if "paid_amount" in data:
                repayment.paid_amount = data["paid_amount"]
                if repayment.loan_amount and repayment.paid_amount >= repayment.loan_amount:
                    repayment.status = "remboursé"
                    repayment.last_payment_date = datetime.utcnow()
            
            if "notes" in data:
                repayment.notes = data["notes"]
            
            repayment.updated_at = datetime.utcnow()
            s.flush()
            
            from services.repayment_service import RepaymentService
            result = RepaymentService._to_dict(repayment)
        
        return jsonify({"repayment": result}), 200
    except Exception as e:
        return error_response(e)
