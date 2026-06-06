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
    
    # Initialize ML models on startup
    try:
        from services.ml_service import MLModelService
        ml = MLModelService()
        if ml.model is None or ml.scaler is None:
            print("[WARNING] ML models not loaded. Initializing...")
            import json
            import pickle
            import numpy as np
            from sklearn.preprocessing import StandardScaler
            from xgboost import XGBClassifier
            
            models_dir = Path(settings.MODEL_PATH).parent
            models_dir.mkdir(parents=True, exist_ok=True)
            
            features = [
                "loan_amnt", "annual_inc", "dti", "fico_range_high", "revol_util",
                "open_acc", "total_acc", "inq_last_6mths", "delinq_2yrs", "acc_now_delinq"
            ]
            
            # Generate synthetic training data
            np.random.seed(42)
            X = np.random.randn(150, len(features)) * 50
            X[:, 0] = np.abs(X[:, 0]) * 1000 + 10000  # loan_amnt
            X[:, 1] = np.abs(X[:, 1]) * 10000 + 50000  # annual_inc
            X[:, 2] = np.abs(X[:, 2]) * 10 + 10  # dti
            X[:, 3] = np.abs(X[:, 3]) * 100 + 500  # fico_range_high
            X[:, 4] = np.abs(X[:, 4]) * 20  # revol_util
            X[:, 5] = np.round(np.abs(X[:, 5])) % 20 + 1  # open_acc
            X[:, 6] = np.round(np.abs(X[:, 6])) % 40 + 2  # total_acc
            X[:, 7] = np.round(np.abs(X[:, 7])) % 10  # inq_6m
            X[:, 8] = np.round(np.abs(X[:, 8])) % 5  # delinq_2y
            X[:, 9] = np.round(np.abs(X[:, 9])) % 3  # acc_delinq
            
            y = np.where((X[:, 1] < 60000) | (X[:, 2] > 35) | (X[:, 3] < 650), 1, 0)
            
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            model = XGBClassifier(n_estimators=30, max_depth=4, random_state=42, eval_metric='logloss', verbosity=0)
            model.fit(X_scaled, y, verbose=False)
            
            with open(settings.MODEL_PATH, "wb") as f:
                pickle.dump(model, f)
            with open(settings.SCALER_PATH, "wb") as f:
                pickle.dump(scaler, f)
            with open(settings.FEATURES_PATH, "w") as f:
                json.dump(features, f)
            
            print("[OK] ML models initialized successfully")
    except Exception as e:
        print(f"[WARNING] ML initialization error: {e}")
    
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
