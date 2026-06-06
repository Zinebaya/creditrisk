from pathlib import Path
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from auth.blueprints import auth_bp
from api.blueprints import api_bp
from api.chat_routes import chat_bp
from api.enterprise_routes import enterprise_bp
from api.superadmin_routes import superadmin_bp
from api.contact_routes import contact_bp
try:
    from api.payment_routes import payment_bp
    _payment_available = True
except ImportError:
    payment_bp = None
    _payment_available = False
from services.logging_service import configure_logging
from services.db import DatabaseService
from services.auth import AuthService
from config.config import settings
from models import Base, User, Client, Prediction, Log, Enterprise, Repayment, ContactMessage

db = SQLAlchemy()
migrate = Migrate()

def create_app() -> Flask:
    frontend_dir = Path(__file__).resolve().parents[1] / "frontend"
    app = Flask(__name__, static_folder=str(frontend_dir), static_url_path="/static")
    
    # SQLAlchemy configuration for Flask-Migrate
    app.config['SQLALCHEMY_DATABASE_URI'] = settings.DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT configuration
    app.config['JWT_SECRET_KEY'] = settings.JWT_SECRET
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)
    app.config['JWT_ALGORITHM'] = 'HS256'
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3001",
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ],
            }
        },
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
    )
    
    configure_logging()
    db_service = DatabaseService(settings.DATABASE_URL)
    db_service.ensure_default_admin(settings.DEFAULT_ADMIN_EMAIL, AuthService.hash_password(settings.DEFAULT_ADMIN_PASSWORD))
    
    # ML models will be lazily loaded on first use to avoid memory exhaustion during startup
    print("[INFO] ML models will be loaded on first prediction request")
    
    @app.route("/")
    def index(): return {"status": "PayPredict API running"}

    @app.route("/health")
    def health(): return {"status": "healthy"}

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(contact_bp, url_prefix="/api")
    app.register_blueprint(enterprise_bp)  # Already has /api/enterprise prefix
    app.register_blueprint(superadmin_bp)  # Already has /api/superadmin prefix
    if payment_bp is not None:
        app.register_blueprint(payment_bp, url_prefix="/api/payment")

    return app

app = create_app()
if __name__ == "__main__": app.run(host="0.0.0.0", port=8000, debug=True)
