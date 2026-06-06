from pathlib import Path
from datetime import timedelta
from flask import Flask, jsonify, request, Response
import httpx
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

    # Catch-all route for Next.js frontend (reverse proxy)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        """Route all non-API requests to Next.js server."""
        # Skip API routes - they're handled by blueprints
        if path.startswith('auth/') or path.startswith('api/'):
            return jsonify({"error": "Not Found"}), 404
        
        try:
            # Proxy request to Next.js server running on port 3000
            url = f"http://localhost:3000/{path}"
            
            # Handle query strings
            if request.query_string:
                url = f"{url}?{request.query_string.decode()}"
            
            # Forward the request
            resp = httpx.request(
                request.method,
                url,
                headers={k: v for k, v in request.headers if k.lower() not in ['host', 'connection']},
                content=request.get_data(),
                follow_redirects=True,
                timeout=30.0
            )
            
            # Return response with proper headers
            response_headers = dict(resp.headers)
            # Remove hop-by-hop headers
            for header in ['transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate']:
                response_headers.pop(header, None)
            
            return Response(resp.content, status=resp.status_code, headers=response_headers)
        except Exception as e:
            print(f"[ERROR] Proxy error: {e}")
            # Fallback: serve index.html for SPA routing
            try:
                with open(str(frontend_dir / "public" / "index.html"), "r") as f:
                    return f.read(), 200, {"Content-Type": "text/html"}
            except:
                return jsonify({"error": "Frontend server unavailable"}), 503

    return app

app = create_app()
if __name__ == "__main__": app.run(host="0.0.0.0", port=8000, debug=True)
