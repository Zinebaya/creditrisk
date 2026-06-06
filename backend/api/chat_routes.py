from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized
from auth.jwt import JWTService
from services.chat_service import ChatService

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["POST"])
def chat():
    """
    Handle chat messages and return AI responses.

    Request body:
    {
        "message": "What is PayPredict?",
        "language": "en" | "fr" | "ar",
        "conversation_id": "optional_conversation_id"
    }

    Response:
    {
        "response": "AI-generated response"
    }
    """
    try:
        # Chat is available without authentication, but we can track user if authenticated
        auth_header = request.headers.get("Authorization", "")
        user_email = None

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            payload = JWTService.decode_access_token(token)
            if payload:
                user_email = payload.get("sub")

        data = request.get_json()
        if not data:
            raise BadRequest("Request body is required")

        message = data.get("message", "").strip()
        language = data.get("language", "en")
        conversation_id = data.get("conversation_id")

        if not message:
            raise BadRequest("Message is required")

        if language not in ["en", "fr", "ar"]:
            language = "en"

        # Generate response using ChatService
        response = ChatService.generate_response(
            message=message, language=language, conversation_id=conversation_id
        )

        return (
            jsonify(
                {
                    "response": response,
                    "language": language,
                    "user_authenticated": user_email is not None,
                }
            ),
            200,
        )

    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
