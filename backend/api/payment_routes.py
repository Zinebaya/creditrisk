"""
Payment Routes Module
Supports Visa, Mastercard, RedotPay, and Wise for Algerian users.
"""
from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden
from datetime import datetime, timedelta
from auth.jwt import JWTService
from services.db import DatabaseService
from config.config import settings

payment_bp = Blueprint("payment", __name__)

def get_db_service() -> DatabaseService:
    return DatabaseService(settings.DATABASE_URL)

def require_auth():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Unauthorized("Missing or invalid token")
    payload = JWTService.decode_access_token(auth_header.split(" ", 1)[1])
    if not payload:
        raise Unauthorized("Invalid or expired token")
    return payload["sub"]

def require_client():
    """Ensure the authenticated user is a client (enterprise admin)."""
    email = require_auth()
    user = get_db_service().get_user_by_email(email)
    if not user:
        raise Unauthorized("User not found")
    if user.get("role") != "client":
        raise Forbidden("Client access required")
    return user

# Available payment methods
PAYMENT_METHODS = {
    "visa": {
        "name": "Carte Visa",
        "name_en": "Visa Card",
        "name_ar": "بطاقة فيزا",
        "icon": "visa",
        "supported": True,
        "countries": ["DZ", "FR", "EN", "US", "CA"],
        "processing_time": "Instantané",
        "fee_percentage": 1.5
    },
    "mastercard": {
        "name": "Carte Mastercard",
        "name_en": "Mastercard Card",
        "name_ar": "بطاقة ماستركارد",
        "icon": "mastercard",
        "supported": True,
        "countries": ["DZ", "FR", "EN", "US", "CA"],
        "processing_time": "Instantané",
        "fee_percentage": 1.5
    },
    "redotpay": {
        "name": "RedotPay",
        "name_en": "RedotPay",
        "name_ar": "RedotPay",
        "icon": "wallet",
        "supported": True,
        "countries": ["DZ", "FR", "EN"],
        "processing_time": "1-2 minutes",
        "fee_percentage": 0.5,
        "description": "Paiement international compatible Algérie"
    },
    "wise": {
        "name": "Wise (TransferWise)",
        "name_en": "Wise",
        "name_ar": "Wise",
        "icon": "bank",
        "supported": True,
        "countries": ["DZ", "FR", "EN", "US", "CA", "EU"],
        "processing_time": "1-2 jours",
        "fee_percentage": 0.3,
        "description": "Virement international aux meilleurs taux"
    }
}

PLANS = {
    "free": {
        "monthly_price": 0,
        "yearly_price": 0,
        "predictions": 3,
        "features": ["predictions_basic", "dashboard", "email_support"]
    },
    "pro": {
        "monthly_price": 2500,
        "yearly_price": 24000,
        "predictions": "unlimited",
        "features": ["predictions_unlimited", "batch_upload", "api_access", "analytics", "priority_support"]
    },
    "enterprise": {
        "monthly_price": 0,
        "yearly_price": 0,
        "predictions": "unlimited",
        "features": ["all_pro", "dedicated_manager", "custom_model", "24_7_support", "on_premise"],
        "contact_sales": True
    }
}

@payment_bp.route("/methods", methods=["GET"])
def get_payment_methods():
    """Get available payment methods."""
    methods = []
    for key, method in PAYMENT_METHODS.items():
        method_info = {
            "id": key,
            "name": method["name"],
            "name_en": method["name_en"],
            "name_ar": method["name_ar"],
            "icon": method["icon"],
            "supported": method["supported"],
            "processing_time": method["processing_time"],
            "fee_percentage": method["fee_percentage"]
        }
        if "description" in method:
            method_info["description"] = method["description"]
        methods.append(method_info)
    
    return jsonify({"methods": methods}), 200


@payment_bp.route("/plans", methods=["GET"])
def get_plans():
    """Get available subscription plans with pricing."""
    plans = []
    for key, plan in PLANS.items():
        plan_info = {
            "id": key,
            "monthly_price": plan["monthly_price"],
            "yearly_price": plan["yearly_price"],
            "predictions": plan["predictions"],
            "features": plan["features"],
        }
        if plan.get("contact_sales"):
            plan_info["contact_sales"] = True
        plans.append(plan_info)
    
    return jsonify({"plans": plans}), 200


@payment_bp.route("/subscribe", methods=["POST"])
def subscribe():
    """Process a subscription upgrade."""
    try:
        user = require_client()
        data = request.get_json()
        
        if not data:
            raise BadRequest("Request body required")
        
        plan_id = data.get("plan_id", "").strip()
        payment_method = data.get("payment_method", "").strip()
        billing_period = data.get("billing_period", "monthly")
        
        if plan_id not in PLANS:
            raise BadRequest(f"Invalid plan: {plan_id}")
        
        if payment_method not in PAYMENT_METHODS:
            raise BadRequest(f"Invalid payment method: {payment_method}")
        
        if not PAYMENT_METHODS[payment_method]["supported"]:
            raise BadRequest(f"Payment method {payment_method} is not supported")
        
        plan = PLANS[plan_id]
        if plan.get("contact_sales"):
            raise BadRequest("Enterprise plan requires contacting sales")
        
        price = plan["yearly_price"] if billing_period == "yearly" else plan["monthly_price"]
        
        dbs = get_db_service()
        
        # Update user plan in database
        dbs.update_user_plan(user["id"], plan_id)
        
        # Create payment history record
        payment_record = dbs.create_payment_record(
            user_id=user["id"],
            amount=price,
            currency="DZD",
            payment_method=payment_method,
            plan_id=plan_id,
            billing_period=billing_period,
            status="completed"
        )
        
        # Set subscription expiration
        expires_at = None
        if billing_period == "yearly":
            expires_at = (datetime.utcnow() + timedelta(days=365)).isoformat()
        elif plan_id == "pro":
            expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()
        
        dbs.update_subscription_expiry(user["id"], expires_at)
        
        return jsonify({
            "success": True,
            "message": "Subscription upgraded successfully",
            "plan_id": plan_id,
            "amount": price,
            "payment_method": payment_method,
            "billing_period": billing_period,
            "expires_at": expires_at
        }), 200
        
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/history", methods=["GET"])
def payment_history():
    """Get payment history for the authenticated user."""
    try:
        user = require_client()
        dbs = get_db_service()
        history = dbs.get_user_payment_history(user["id"])
        
        return jsonify({
            "payments": history,
            "total": len(history)
        }), 200
        
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/status", methods=["GET"])
def subscription_status():
    """Get current subscription status for the authenticated user."""
    try:
        user = require_client()
        dbs = get_db_service()
        
        current_plan = user.get("plan_tier", "free")
        subscription_status = user.get("subscription_status", "active")
        expires_at = user.get("subscription_expires_at")
        
        # Check if subscription has expired
        is_expired = False
        if expires_at:
            try:
                exp_date = datetime.fromisoformat(expires_at)
                is_expired = exp_date < datetime.utcnow()
            except (ValueError, TypeError):
                pass
        
        if is_expired:
            subscription_status = "expired"
        
        return jsonify({
            "plan": current_plan,
            "status": subscription_status,
            "expires_at": expires_at,
            "is_expired": is_expired,
            "can_upgrade": current_plan != "enterprise"
        }), 200
        
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500