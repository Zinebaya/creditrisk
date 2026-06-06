import sys
from pathlib import Path

# Add backend directory to path to allow absolute prefix-free imports
backend_path = str(Path(__file__).resolve().parents[1] / "backend")
if backend_path not in sys.path:
    # Add backend path after existing entries so top-level packages (e.g., root `models`)
    # are resolved first. Inserting at position 0 caused conflicts where
    # `backend/models` shadowed the project's root `models` package.
    sys.path.append(backend_path)

import logging
import redis
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager

from config.config import settings
from services.cache import CacheClient
from services.db import DatabaseService
from services.auth import AuthService
from services.logging_service import configure_logging
from api.blueprints import register_blueprints
from backend.auth.blueprints import auth_bp

FRONTEND_DIR = Path(__file__).resolve().parents[1] / "frontend"


def create_app() -> Flask:
    configure_logging()
    app = Flask(__name__, static_folder=None)
    CORS(
        app,
        resources={
            r"/api/*": {"origins": "*"},
            r"/auth/*": {"origins": "*"},
        },
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
    )
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET
    app.config["JSON_SORT_KEYS"] = False

    limiter_storage = "memory://"
    if settings.REDIS_URL:
        try:
            redis.Redis.from_url(settings.REDIS_URL).ping()
            limiter_storage = settings.REDIS_URL
        except Exception:
            logger = logging.getLogger(__name__)
            logger.warning("redis_unavailable_for_rate_limiting; falling back to memory storage")

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[settings.RATE_LIMIT],
        storage_uri=limiter_storage,
    )
    limiter.init_app(app)

    JWTManager(app)
    app.cache = CacheClient(settings.REDIS_URL)
    app.db = DatabaseService(settings.DATABASE_URL)
    app.db.ensure_default_admin(settings.DEFAULT_ADMIN_EMAIL, AuthService.hash_password(settings.DEFAULT_ADMIN_PASSWORD))

    register_blueprints(app)
    
    # Register auth blueprint for /auth routes
    app.register_blueprint(auth_bp, url_prefix="/auth")

    @app.route("/", methods=["GET"])
    def serve_frontend():
        if (FRONTEND_DIR / "out" / "index.html").exists():
            return send_from_directory(FRONTEND_DIR / "out", "index.html")
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/static/<path:filename>")
    def serve_static(filename):
        if (FRONTEND_DIR / "out" / filename).exists():
            return send_from_directory(FRONTEND_DIR / "out", filename)
        return send_from_directory(FRONTEND_DIR, filename)

    @app.errorhandler(400)
    def bad_request(error):
        return {"error": str(error)}, 400

    @app.errorhandler(401)
    def unauthorized(error):
        return {"error": str(error)}, 401

    @app.errorhandler(403)
    def forbidden(error):
        return {"error": str(error)}, 403

    @app.errorhandler(404)
    def not_found(error):
        return {"error": str(error)}, 404

    @app.errorhandler(500)
    def internal_error(error):
        logging.exception(error)
        return {"error": "Internal server error"}, 500

    return app
