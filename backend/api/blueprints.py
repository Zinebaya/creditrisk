from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden
import io, csv
import numpy as np
import pandas as pd
from auth.jwt import JWTService
from services.cache import CacheClient
from services.db import DatabaseService
from services.ml_service import MLModelService
from services.auth import AuthService
from auth.password_validation import validate_password_strength
from utils.validation import parse_request_json, validate_json_payload, validate_phone_format
from config.config import settings

api_bp = Blueprint("api", __name__)


# ==================== HELPERS ====================

def get_db_service() -> DatabaseService:
    return DatabaseService(settings.DATABASE_URL)

def get_cache_client() -> CacheClient:
    return CacheClient(settings.REDIS_URL)

def get_ml_service() -> MLModelService:
    return MLModelService()

def require_auth():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Unauthorized("Missing or invalid token")
    payload = JWTService.decode_access_token(auth_header.split(" ", 1)[1])
    if not payload:
        raise Unauthorized("Invalid or expired token")
    return payload["sub"]

def require_admin():
    """Ensure the authenticated user has admin (super admin) role."""
    email = require_auth()
    user = get_db_service().get_user_by_email(email)
    if not user:
        raise Unauthorized("User not found")
    if user.get("role") != "admin":
        raise Forbidden("Admin access required")
    return user

def require_enterprise():
    """Ensure the authenticated user is an enterprise admin (role='client') or collaborator."""
    email = require_auth()
    user = get_db_service().get_user_by_email(email)
    if not user:
        raise Unauthorized("User not found")
    if user.get("role") not in ("client", "client_user"):
        raise Forbidden("Enterprise access required")
    return user

def require_enterprise_admin():
    """Ensure the authenticated user is an enterprise admin (role='client' only)."""
    email = require_auth()
    user = get_db_service().get_user_by_email(email)
    if not user:
        raise Unauthorized("User not found")
    if user.get("role") != "client":
        raise Forbidden("Enterprise admin access required")
    return user

def get_enterprise_id(user: dict) -> int:
    """Return the enterprise root ID for multi-tenancy filtering."""
    return user.get("parent_id") or user.get("id")

def make_json_serializable(obj):
    """Recursively convert numpy/pandas types to native Python types for JSON serialization."""
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [make_json_serializable(v) for v in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj

def error_response(e):
    status = 401 if isinstance(e, Unauthorized) else 403 if isinstance(e, Forbidden) else 400 if isinstance(e, (BadRequest, ValueError)) else 500
    msg = str(e) if isinstance(e, (BadRequest, ValueError, Unauthorized, Forbidden)) else "Internal server error"
    return jsonify({"error": msg}), status


# ==================== CLIENT MANAGEMENT ====================

@api_bp.route("/clients", methods=["GET"])
def clients():
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        # Enterprise users (client or client_user) only see their enterprise's clients
        if user and user.get("role") in ("client", "client_user"):
            owner_id = get_enterprise_id(user)
            return jsonify({"clients": dbs.list_clients(owner_id=owner_id)}), 200
        # Super admin sees all clients
        return jsonify({"clients": dbs.list_clients()}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/clients", methods=["POST"])
def create_client():
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user or user.get("role") not in ("client", "client_user"):
            raise Forbidden("Enterprise access required")
        data = parse_request_json(request)
        for field in ["name", "email", "phone", "wilaya", "city"]:
            if not str(data.get(field, "")).strip():
                raise BadRequest(f"{field.capitalize()} is required")
        if not validate_phone_format(data["phone"]):
            raise BadRequest("Invalid phone number format")
        owner_id = get_enterprise_id(user)
        payload = {
            "name": str(data.get("name", "")).strip(),
            "first_name": str(data.get("first_name", "")).strip() or None,
            "gender": str(data.get("gender", "")).strip() or None,
            "email": str(data.get("email", "")).strip(),
            "phone": str(data.get("phone", "")).strip(),
            "address": str(data.get("address", "")).strip() or None,
            "wilaya": str(data.get("wilaya", "")).strip(),
            "city": str(data.get("city", "")).strip(),
            "sector": str(data.get("sector", "")).strip() or None,
            "repayment_status": str(data.get("repayment_status", "Crédit en cours")).strip(),
            "notes": str(data.get("notes", "")).strip() or None,
        }
        return jsonify({"client": dbs.create_client(payload, owner_id=owner_id)}), 201
    except Exception as e:
        return error_response(e)


@api_bp.route("/clients/<int:client_id>", methods=["PUT"])
def update_client(client_id: int):
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user or user.get("role") not in ("client", "client_user"):
            raise Forbidden("Enterprise access required")
        data = parse_request_json(request)
        owner_id = get_enterprise_id(user)
        payload = {}
        for field in ["name", "first_name", "gender", "email", "phone", "address", "wilaya", "city", "sector", "repayment_status", "notes"]:
            if field in data:
                payload[field] = str(data[field]).strip() if data[field] is not None else None
        if "phone" in payload and payload["phone"] and not validate_phone_format(payload["phone"]):
            raise BadRequest("Invalid phone number format")
        result = dbs.update_client(client_id, payload, owner_id=owner_id)
        if not result:
            return jsonify({"error": "Client not found or access denied"}), 404
        return jsonify({"client": result}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/clients/<int:client_id>", methods=["DELETE"])
def delete_client(client_id: int):
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user or user.get("role") not in ("client", "client_user"):
            raise Forbidden("Enterprise access required")
        owner_id = get_enterprise_id(user)
        dbs.delete_client(client_id, owner_id=owner_id)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return error_response(e)


# ==================== PREDICTION ENDPOINTS ====================

@api_bp.route("/predict", methods=["POST"])
def predict():
    try:
        user_email = require_auth()
        data = parse_request_json(request)
        validated = validate_json_payload(data)
        client_id = validated.pop("client_id", None)
        dbs = get_db_service()
        if client_id is None or not dbs.client_exists(client_id):
            raise BadRequest("A real client_id is required")

        user = dbs.get_user_by_email(user_email)
        if user:
            limit_check = dbs.check_prediction_limit(user["id"])
            if not limit_check["allowed"]:
                return jsonify({
                    "error": "Prediction limit reached",
                    "message": "You have reached your monthly free plan limit of 3 predictions",
                    "used": limit_check["used"],
                    "limit": limit_check["limit"],
                    "upgrade_prompt": True
                }), 429

        cached = get_cache_client().get_prediction(validated)
        if cached:
            return jsonify(cached), 200
        result = get_ml_service().predict(validated)
        get_cache_client().set_prediction(validated, result)

        if user:
            dbs.track_prediction(user["id"])
            dbs.create_prediction(user["id"], {**validated, "client_id": client_id}, result["prediction"], result["probability"], result["decision"], result.get("explanation", {}), client_id=client_id)
        else:
            dbs.create_prediction(None, {**validated, "client_id": client_id}, result["prediction"], result["probability"], result["decision"], result.get("explanation", {}), client_id=client_id)

        return jsonify(result), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/batch_predict", methods=["POST"])
def batch_predict():
    """Batch prediction from CSV or Excel file upload. Supports XLSX, validation and row-level errors."""
    try:
        require_auth()
        if "file" not in request.files:
            raise BadRequest("No file uploaded")
        f = request.files["file"]
        if not f.filename:
            raise BadRequest("Filename is empty")
        
        filename = f.filename.lower()
        
        ml = get_ml_service()
        if ml.model is None or ml.scaler is None:
            raise RuntimeError("ML model not loaded")

        # Read CSV or Excel
        if filename.endswith(".csv"):
            content = f.read().decode("utf-8", errors="replace")
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
        elif filename.endswith((".xlsx", ".xls")):
            try:
                df = pd.read_excel(f)
                # Replace nan with None
                df = df.replace({np.nan: None})
                rows = df.to_dict(orient="records")
            except Exception as excel_err:
                raise BadRequest(f"Failed to parse Excel file: {str(excel_err)}")
        else:
            raise BadRequest("Only .csv, .xlsx, or .xls files are accepted")

        if not rows:
            raise BadRequest("Uploaded file is empty")

        # Column-level validation
        first_row = rows[0]
        missing_cols = []
        for feat in ml.features:
            if feat not in first_row:
                missing_cols.append(feat)
        if "client_id" not in first_row:
            missing_cols.append("client_id")
        
        if missing_cols:
            raise BadRequest(f"Missing required columns: {', '.join(missing_cols)}")

        predictions = []
        dbs = get_db_service()
        for i, row in enumerate(rows):
            try:
                # Validate client_id
                c_id_raw = row.get("client_id")
                if c_id_raw is None or str(c_id_raw).strip() == "":
                    raise ValueError("client_id is missing")
                try:
                    client_id = int(float(c_id_raw))
                except (ValueError, TypeError):
                    raise ValueError(f"client_id '{c_id_raw}' is not a valid integer")
                
                if not dbs.client_exists(client_id):
                    raise ValueError(f"Client with ID {client_id} does not exist")

                # Validate features
                feature_errors = []
                for feat in ml.features:
                    val = row.get(feat)
                    if val is None or str(val).strip() == "":
                        feature_errors.append(f"{feat} is empty")
                    else:
                        try:
                            float(val)
                        except ValueError:
                            feature_errors.append(f"{feat} value '{val}' is not numeric")
                
                if feature_errors:
                    raise ValueError("; ".join(feature_errors))

                feature_vector = [float(row.get(feat)) for feat in ml.features]
                scaled = ml.scaler.transform([feature_vector])
                proba = ml.model.predict_proba(scaled)[0]
                probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
                classification = "high_risk" if probability >= 0.5 else "low_risk"
                decision = "decline" if classification == "high_risk" else "approve"
                
                # Save prediction
                user_email = require_auth()
                user = dbs.get_user_by_email(user_email)
                input_json = {feat: float(row.get(feat)) for feat in ml.features}
                
                if user:
                    dbs.track_prediction(user["id"])
                    dbs.create_prediction(user["id"], {**input_json, "client_id": client_id}, classification, probability, decision, {}, client_id=client_id)
                else:
                    dbs.create_prediction(None, {**input_json, "client_id": client_id}, classification, probability, decision, {}, client_id=client_id)

                pred = {
                    "rowNumber": i + 1,
                    "client_id": client_id,
                    "loan_amnt": float(row.get("loan_amnt", 0) or 0),
                    "annual_inc": float(row.get("annual_inc", 0) or 0),
                    "probability": round(probability, 6),
                    "prediction": classification,
                    "decision": decision,
                    "status": "success"
                }
                predictions.append(make_json_serializable(pred))
            except Exception as row_err:
                predictions.append({
                    "rowNumber": i + 1,
                    "client_id": row.get("client_id", "?"),
                    "error": str(row_err),
                    "prediction": "error",
                    "probability": 0.0,
                    "decision": "error",
                    "status": "failed"
                })

        return jsonify({"predictions": predictions, "count": len(predictions)}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/history", methods=["GET"])
def history():
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        filter_user_id = user["id"] if user and user.get("role") in ("client", "client_user") else None
        return jsonify({"predictions": dbs.get_predictions(user_id=filter_user_id, limit=int(request.args.get("limit", 100)))}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/analytics", methods=["GET"])
def analytics():
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if user and user.get("role") in ("client", "client_user"):
            return jsonify(dbs.get_user_analytics(user["id"])), 200
        return jsonify(dbs.get_analytics()), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/usage", methods=["GET"])
def usage():
    try:
        user_email = require_auth()
        dbs = get_db_service()
        user = dbs.get_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404
        usage_data = dbs.check_prediction_limit(user["id"])
        return jsonify({
            "plan_tier": user["plan_tier"],
            "used": usage_data.get("used", 0),
            "limit": usage_data.get("limit"),
            "remaining": usage_data.get("remaining"),
            "limit_reached": usage_data.get("limit_reached", False),
            "subscription_status": user["subscription_status"]
        }), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/features", methods=["GET"])
def features():
    try:
        require_auth()
        return jsonify({"features": get_ml_service().features}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/health", methods=["GET"])
def health():
    ml = get_ml_service()
    return jsonify({"status": "healthy", "model_loaded": ml.model is not None}), 200


# ==================== SUPER ADMIN ENDPOINTS ====================

@api_bp.route("/admin/stats", methods=["GET"])
def admin_stats():
    """Global platform statistics (super admin only)."""
    try:
        require_admin()
        stats = get_db_service().get_admin_stats()
        return jsonify(stats), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/predictions", methods=["GET"])
def admin_predictions():
    """All predictions across all users (super admin only)."""
    try:
        require_admin()
        limit = int(request.args.get("limit", 100))
        predictions = get_db_service().get_all_predictions(limit=limit)
        return jsonify({"predictions": predictions}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/users/<int:user_id>/toggle-active", methods=["PUT"])
def admin_toggle_user_active(user_id: int):
    """Toggle user active/inactive (super admin only)."""
    try:
        admin = require_admin()
        if user_id == admin["id"]:
            raise BadRequest("Cannot disable your own account")
        result = get_db_service().toggle_user_active(user_id)
        if not result:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": result}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/logs", methods=["GET"])
def admin_logs():
    """System logs (super admin only)."""
    try:
        require_admin()
        limit = int(request.args.get("limit", 50))
        logs = get_db_service().get_system_logs(limit=limit)
        return jsonify({"logs": logs}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/users/<int:user_id>/predictions", methods=["GET"])
def admin_user_predictions(user_id: int):
    """Get predictions for a specific user (super admin only)."""
    try:
        require_admin()
        limit = int(request.args.get("limit", 100))
        predictions = get_db_service().get_user_predictions(user_id, limit=limit)
        return jsonify({"predictions": predictions}), 200
    except Exception as e:
        return error_response(e)


# ==================== ENTERPRISE ENDPOINTS ====================

@api_bp.route("/enterprise/users", methods=["GET"])
def enterprise_list_users():
    """List all collaborators for this enterprise admin."""
    try:
        user = require_enterprise_admin()
        users = get_db_service().list_enterprise_users(parent_id=user["id"])
        return jsonify({"users": users}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/enterprise/users", methods=["POST"])
def enterprise_create_user():
    """Create a collaborator account under this enterprise."""
    try:
        user = require_enterprise_admin()
        data = parse_request_json(request)
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        first_name = str(data.get("first_name", "")).strip() or None
        last_name = str(data.get("last_name", "")).strip() or None

        if not email or not password:
            raise BadRequest("Email and password are required")
        if "@" not in email or "." not in email.split("@")[1]:
            raise BadRequest("Invalid email format")

        is_valid, err = validate_password_strength(password)
        if not is_valid:
            raise BadRequest(err)

        dbs = get_db_service()
        if dbs.get_user_by_email(email):
            raise BadRequest("User already exists")

        password_hash = AuthService.hash_password(password)
        new_user = dbs.create_enterprise_user(
            email=email,
            password_hash=password_hash,
            parent_id=user["id"],
            first_name=first_name,
            last_name=last_name,
        )
        return jsonify({"user": new_user}), 201
    except Exception as e:
        return error_response(e)


@api_bp.route("/enterprise/users/<int:user_id>", methods=["PUT"])
def enterprise_update_user(user_id: int):
    """Update a collaborator (first/last name, active status)."""
    try:
        user = require_enterprise_admin()
        data = parse_request_json(request)
        payload = {}
        for field in ["first_name", "last_name", "is_active"]:
            if field in data:
                payload[field] = data[field]
        result = get_db_service().update_enterprise_user(user_id, parent_id=user["id"], data=payload)
        if not result:
            return jsonify({"error": "User not found or access denied"}), 404
        return jsonify({"user": result}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/enterprise/users/<int:user_id>", methods=["DELETE"])
def enterprise_delete_user(user_id: int):
    """Delete a collaborator."""
    try:
        user = require_enterprise_admin()
        dbs = get_db_service()
        target = dbs.get_user_by_id(user_id)
        if not target or target.get("parent_id") != user["id"]:
            return jsonify({"error": "User not found or access denied"}), 404
        dbs.delete_user(user_id)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/enterprise/users/<int:user_id>/reset-password", methods=["POST"])
def enterprise_reset_password(user_id: int):
    """Reset a collaborator's password."""
    try:
        user = require_enterprise_admin()
        data = parse_request_json(request)
        new_password = str(data.get("password", ""))
        if not new_password:
            raise BadRequest("New password is required")
        is_valid, err = validate_password_strength(new_password)
        if not is_valid:
            raise BadRequest(err)
        new_hash = AuthService.hash_password(new_password)
        ok = get_db_service().reset_enterprise_user_password(user_id, parent_id=user["id"], new_password_hash=new_hash)
        if not ok:
            return jsonify({"error": "User not found or access denied"}), 404
        return jsonify({"ok": True}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/enterprise/profile", methods=["GET"])
def enterprise_get_profile():
    """Get enterprise admin profile."""
    try:
        user = require_enterprise_admin()
        return jsonify({"profile": user}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/enterprise/profile", methods=["PUT"])
def enterprise_update_profile():
    """Update enterprise admin profile."""
    try:
        user = require_enterprise_admin()
        data = parse_request_json(request)
        dbs = get_db_service()

        payload = {}
        for field in ["first_name", "last_name", "phone", "wilaya", "address", "photo_url", "company_name", "company_sector"]:
            if field in data:
                payload[field] = str(data[field]).strip() if data[field] is not None else None

        # Handle password change if provided
        if data.get("new_password"):
            old_password = str(data.get("current_password", ""))
            stored_hash = dbs.verify_user_password(user["email"])
            if not stored_hash or not AuthService.verify_password(old_password, stored_hash):
                raise BadRequest("Current password is incorrect")
            is_valid, err = validate_password_strength(data["new_password"])
            if not is_valid:
                raise BadRequest(err)
            payload["password_hash"] = AuthService.hash_password(data["new_password"])

        result = dbs.update_enterprise_profile(user["id"], payload)
        if not result:
            return jsonify({"error": "Profile update failed"}), 500
        return jsonify({"profile": result}), 200
    except Exception as e:
        return error_response(e)


# ==================== SUPER ADMIN PLATFORM ENDPOINTS ====================

@api_bp.route("/superadmin/companies", methods=["GET"])
def superadmin_companies():
    """List all enterprise companies (super admin only)."""
    try:
        require_admin()
        companies = get_db_service().get_all_enterprises()
        return jsonify({"companies": companies}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/superadmin/companies/<int:company_id>/plan", methods=["PUT"])
def superadmin_update_company_plan(company_id: int):
    """Update a company's subscription plan (super admin only)."""
    try:
        require_admin()
        data = parse_request_json(request)
        plan_tier = str(data.get("plan_tier", "")).strip()
        valid_plans = ["free", "pro", "enterprise", "unlimited"]
        if plan_tier not in valid_plans:
            raise BadRequest(f"Plan must be one of: {', '.join(valid_plans)}")
        get_db_service().update_user_plan(company_id, plan_tier)
        return jsonify({"ok": True, "plan_tier": plan_tier}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/superadmin/companies/<int:company_id>/toggle-active", methods=["PUT"])
def superadmin_toggle_company_active(company_id: int):
    """Activate or deactivate a company (super admin only)."""
    try:
        require_admin()
        result = get_db_service().toggle_user_active(company_id)
        if not result:
            return jsonify({"error": "Company not found"}), 404
        return jsonify({"ok": True, "is_active": result["is_active"]}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/superadmin/users", methods=["GET"])
def superadmin_users():
    """List all platform users (super admin only)."""
    try:
        require_admin()
        users = get_db_service().list_users()
        return jsonify({"users": users}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/superadmin/sectors", methods=["GET"])
def superadmin_sectors():
    """Get sector statistics (super admin only)."""
    try:
        require_admin()
        sectors = get_db_service().get_sector_stats()
        return jsonify({"sectors": sectors}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/superadmin/analytics", methods=["GET"])
def superadmin_analytics():
    """Get global platform analytics (super admin only)."""
    try:
        require_admin()
        stats = get_db_service().get_admin_stats()
        return jsonify(stats), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/profile", methods=["GET"])
def admin_get_profile():
    """Get admin profile."""
    try:
        user = require_admin()
        return jsonify({"profile": user}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/profile", methods=["PUT"])
def admin_update_profile():
    """Update admin profile."""
    try:
        user = require_admin()
        data = parse_request_json(request)
        dbs = get_db_service()

        payload = {}
        for field in ["first_name", "last_name", "phone", "wilaya", "address", "photo_url"]:
            if field in data:
                payload[field] = str(data[field]).strip() if data[field] is not None else None

        # Handle password change if provided
        if data.get("new_password"):
            old_password = str(data.get("current_password", ""))
            stored_hash = dbs.verify_user_password(user["email"])
            if not stored_hash or not AuthService.verify_password(old_password, stored_hash):
                raise BadRequest("Current password is incorrect")
            is_valid, err = validate_password_strength(data["new_password"])
            if not is_valid:
                raise BadRequest(err)
            payload["password_hash"] = AuthService.hash_password(data["new_password"])

        result = dbs.update_enterprise_profile(user["id"], payload)
        if not result:
            return jsonify({"error": "Profile update failed"}), 500
        return jsonify({"profile": result}), 200
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/users", methods=["POST"])
def admin_create_user():
    """Create a new client user (super admin only)."""
    try:
        require_admin()
        data = parse_request_json(request)
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        first_name = str(data.get("first_name", "")).strip() or None
        last_name = str(data.get("last_name", "")).strip() or None
        phone = str(data.get("phone", "")).strip() or None
        wilaya = str(data.get("wilaya", "")).strip() or None
        address = str(data.get("address", "")).strip() or None
        company_name = str(data.get("company_name", "")).strip() or None
        company_sector = str(data.get("company_sector", "")).strip() or None
        plan_tier = str(data.get("plan_tier", "free")).strip()

        if not email or not password:
            raise BadRequest("Email and password are required")
        if "@" not in email or "." not in email.split("@")[1]:
            raise BadRequest("Invalid email format")

        is_valid, err = validate_password_strength(password)
        if not is_valid:
            raise BadRequest(err)

        dbs = get_db_service()
        if dbs.get_user_by_email(email):
            raise BadRequest("User already exists")

        password_hash = AuthService.hash_password(password)
        new_user = dbs.create_user(
            email=email,
            password_hash=password_hash,
            role="client",
            plan_tier=plan_tier,
            is_active=True,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            wilaya=wilaya,
            address=address,
            company_name=company_name,
            company_sector=company_sector
        )
        return jsonify({"user": new_user}), 201
    except Exception as e:
        return error_response(e)


@api_bp.route("/admin/users/<int:user_id>", methods=["PUT"])
def admin_update_user(user_id: int):
    """Modify any user's profile info (super admin only)."""
    try:
        require_admin()
        data = parse_request_json(request)
        dbs = get_db_service()

        payload = {}
        for field in ["first_name", "last_name", "phone", "wilaya", "address", "photo_url", "company_name", "company_sector", "plan_tier", "is_active"]:
            if field in data:
                payload[field] = data[field]

        # Handle password change if provided
        if data.get("password"):
            is_valid, err = validate_password_strength(data["password"])
            if not is_valid:
                raise BadRequest(err)
            payload["password_hash"] = AuthService.hash_password(data["password"])

        result = dbs.update_enterprise_profile(user_id, payload)
        if not result:
            return jsonify({"error": "User not found or update failed"}), 404
        return jsonify({"user": result}), 200
    except Exception as e:
        return error_response(e)
