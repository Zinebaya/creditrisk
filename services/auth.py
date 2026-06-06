import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        if not hashed:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

    @staticmethod
    def validate_email(email: str) -> bool:
        return isinstance(email, str) and "@" in email and "." in email.split("@")[1]

    @staticmethod
    def create_access_token(user_id: int, email: str, role: str = "user") -> str:
        payload = {
            "user_id": user_id,
            "email": email,
            "role": role,
            "exp": datetime.utcnow() + timedelta(hours=1),
            "iat": datetime.utcnow(),
        }
        secret = os.getenv("JWT_SECRET", "please-set-jwt-secret")
        return jwt.encode(payload, secret, algorithm="HS256")

    @staticmethod
    def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            secret = os.getenv("JWT_SECRET", "please-set-jwt-secret")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
