import datetime
import time
import uuid
from typing import Dict, Optional, Set

import jwt
import redis

from config.config import settings


class JWTService:
    """
    JWT token service with blacklist support and refresh rotation
    - Uses Redis for blacklist storage when available, falls back to in-memory set
    - Adds `jti` claim to tokens for reliable revocation
    """
    ACCESS_EXPIRES_MINUTES = 60
    REFRESH_EXPIRES_MINUTES = 60 * 24 * 7

    # Fall-back in-memory blacklist (store jti values)
    _token_blacklist: Set[str] = set()

    # Redis client (initialized lazily)
    _redis_client = None

    @staticmethod
    def _get_redis():
        if JWTService._redis_client is not None:
            return JWTService._redis_client
        try:
            if settings.REDIS_URL:
                JWTService._redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                JWTService._redis_client.ping()
                return JWTService._redis_client
        except Exception:
            JWTService._redis_client = None
        return None

    @staticmethod
    def _now_ts() -> int:
        return int(time.time())

    @staticmethod
    def create_access_token(subject: str, user_id: int, role: str, expires_minutes: int = ACCESS_EXPIRES_MINUTES) -> str:
        now = JWTService._now_ts()
        jti = str(uuid.uuid4())
        exp = now + expires_minutes * 60
        payload = {
            "sub": subject,
            "user_id": user_id,
            "role": role,
            "iat": now,
            "exp": exp,
            "jti": jti,
            "scope": "access",
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    @staticmethod
    def create_refresh_token(subject: str, expires_minutes: int = REFRESH_EXPIRES_MINUTES) -> str:
        now = JWTService._now_ts()
        jti = str(uuid.uuid4())
        exp = now + expires_minutes * 60
        payload = {
            "sub": subject,
            "iat": now,
            "exp": exp,
            "jti": jti,
            "scope": "refresh",
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    @staticmethod
    def decode_access_token(token: str) -> Optional[Dict[str, any]]:
        payload = JWTService._decode(token)
        if payload and payload.get("scope") == "access":
            if JWTService.is_token_blacklisted(payload.get("jti") or token):
                return None
            return payload
        return None

    @staticmethod
    def decode_refresh_token(token: str) -> Optional[Dict[str, any]]:
        payload = JWTService._decode(token)
        if payload and payload.get("scope") == "refresh":
            if JWTService.is_token_blacklisted(payload.get("jti") or token):
                return None
            return payload
        return None

    @staticmethod
    def blacklist_token(token_or_jti: str) -> None:
        """Blacklist a token by token string or jti value."""
        # If token string provided, try decode to extract jti
        jti = token_or_jti
        try:
            # If looks like a JWT (has two dots), decode to extract jti
            if token_or_jti.count(".") == 2:
                payload = JWTService._decode(token_or_jti)
                if payload and payload.get("jti"):
                    jti = payload.get("jti")
        except Exception:
            pass

        if not jti:
            return

        r = JWTService._get_redis()
        if r:
            # Use a simple key with TTL; value is arbitrary
            key = f"jwt:blacklist:{jti}"
            try:
                # Set a marker with long expiry; exact expiry not critical
                r.set(key, "1", ex=JWTService.REFRESH_EXPIRES_MINUTES * 60)
                return
            except Exception:
                pass

        # Fallback to in-memory set
        JWTService._token_blacklist.add(jti)

    @staticmethod
    def is_token_blacklisted(token_or_jti: str) -> bool:
        jti = token_or_jti
        try:
            if token_or_jti.count(".") == 2:
                payload = JWTService._decode(token_or_jti)
                if payload and payload.get("jti"):
                    jti = payload.get("jti")
        except Exception:
            pass

        if not jti:
            return False

        r = JWTService._get_redis()
        if r:
            try:
                return r.exists(f"jwt:blacklist:{jti}") == 1
            except Exception:
                pass

        return jti in JWTService._token_blacklist

    @staticmethod
    def _decode(token: str) -> Optional[Dict[str, any]]:
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
