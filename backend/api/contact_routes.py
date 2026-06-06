from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden
from datetime import datetime
from services.db import DatabaseService
from services.email import EmailService  # We'll create this too
from auth.jwt import JWTService
from config.config import settings

contact_bp = Blueprint("contact", __name__)

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

def require_admin():
    """Ensure the authenticated user has admin role."""
    email = require_auth()
    user = get_db_service().get_user_by_email(email)
    if not user or user.get("role") != "admin":
        raise Forbidden("Admin access required")
    return user

# ==================== PUBLIC ENDPOINTS ====================

@contact_bp.route("/contact", methods=["POST"])
def submit_contact():
    """Submit a contact form - public endpoint (no auth required)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        # Validate required fields
        required_fields = ["name", "email", "subject", "message"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        subject = data.get("subject", "").strip()
        message = data.get("message", "").strip()
        message_type = data.get("message_type", "contact")  # "contact", "demo", "support"
        
        # Basic validation
        if not name or len(name) < 2:
            return jsonify({"error": "Name must be at least 2 characters"}), 400
        if not email or "@" not in email:
            return jsonify({"error": "Invalid email address"}), 400
        if not subject or len(subject) < 3:
            return jsonify({"error": "Subject must be at least 3 characters"}), 400
        if not message or len(message) < 10:
            return jsonify({"error": "Message must be at least 10 characters"}), 400
        
        # Add to database
        db = get_db_service()
        contact_id = db.create_contact_message(
            name=name,
            email=email,
            subject=subject,
            message=message,
            message_type=message_type
        )
        
        # Send admin notification email (optional, will fail gracefully if email not configured)
        try:
            email_service = EmailService(settings.SMTP_SERVER, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASSWORD)
            email_service.send_admin_contact_notification(
                contact_name=name,
                contact_email=email,
                subject=subject,
                message=message,
                message_type=message_type,
                admin_email=settings.DEFAULT_ADMIN_EMAIL
            )
        except Exception as e:
            print(f"[WARNING] Failed to send admin email notification: {e}")
        
        return jsonify({
            "success": True,
            "message": "Thank you for contacting us. We will get back to you soon.",
            "contact_id": contact_id
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== ADMIN ENDPOINTS ====================

@contact_bp.route("/admin/messages", methods=["GET"])
def admin_get_messages():
    """Get all contact messages (admin only)"""
    try:
        require_admin()
        
        # Query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        is_read = request.args.get("is_read", None)
        message_type = request.args.get("type", None)
        
        db = get_db_service()
        
        # Build filters
        filters = {}
        if is_read is not None:
            filters["is_read"] = is_read.lower() == "true"
        if message_type:
            filters["message_type"] = message_type
        
        # Get messages
        messages, total = db.get_contact_messages(
            page=page,
            per_page=per_page,
            filters=filters
        )
        
        return jsonify({
            "messages": messages,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        }), 200
    
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contact_bp.route("/admin/messages/<int:message_id>", methods=["GET"])
def admin_get_message(message_id):
    """Get a specific contact message (admin only)"""
    try:
        require_admin()
        
        db = get_db_service()
        message = db.get_contact_message_by_id(message_id)
        
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Mark as read if not already
        if not message.get("is_read"):
            db.mark_contact_message_as_read(message_id)
            message["is_read"] = True
            message["read_at"] = datetime.utcnow().isoformat()
        
        return jsonify(message), 200
    
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contact_bp.route("/admin/messages/<int:message_id>/respond", methods=["POST"])
def admin_respond_message(message_id):
    """Admin responds to a contact message"""
    try:
        admin = require_admin()
        
        data = request.get_json()
        if not data or not data.get("response"):
            return jsonify({"error": "Response message required"}), 400
        
        response = data.get("response", "").strip()
        if len(response) < 5:
            return jsonify({"error": "Response must be at least 5 characters"}), 400
        
        db = get_db_service()
        
        # Update message with response
        db.respond_to_contact_message(
            message_id=message_id,
            response_message=response,
            admin_id=admin.get("id")
        )
        
        # Send response email to user (optional)
        try:
            original_msg = db.get_contact_message_by_id(message_id)
            email_service = EmailService(settings.SMTP_SERVER, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASSWORD)
            email_service.send_contact_response(
                contact_email=original_msg["email"],
                contact_name=original_msg["name"],
                response=response
            )
        except Exception as e:
            print(f"[WARNING] Failed to send response email: {e}")
        
        return jsonify({
            "success": True,
            "message": "Response sent to user"
        }), 200
    
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contact_bp.route("/admin/messages/<int:message_id>/delete", methods=["DELETE"])
def admin_delete_message(message_id):
    """Delete a contact message (admin only)"""
    try:
        require_admin()
        
        db = get_db_service()
        db.delete_contact_message(message_id)
        
        return jsonify({
            "success": True,
            "message": "Message deleted"
        }), 200
    
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contact_bp.route("/admin/messages/stats", methods=["GET"])
def admin_message_stats():
    """Get contact message statistics (admin only)"""
    try:
        require_admin()
        
        db = get_db_service()
        stats = db.get_contact_message_stats()
        
        return jsonify(stats), 200
    
    except Unauthorized as e:
        return jsonify({"error": str(e)}), 401
    except Forbidden as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500
