import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Get project root
PROJECT_ROOT = Path(__file__).parent.parent

@dataclass
class Settings:
    FLASK_ENV: str = os.getenv("FLASK_ENV", "production")
    FLASK_DEBUG: bool = os.getenv("FLASK_DEBUG", "0") in ["1", "true", "True"]
    SECRET_KEY: str = os.getenv("SECRET_KEY", "please-set-a-secret")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "please-set-jwt-secret")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", os.getenv("SUPABASE_DB_URL", "postgresql://postgres:password@db:5432/credit_risk"))
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(PROJECT_ROOT / "models" / "model.pkl"))
    SCALER_PATH: str = os.getenv("SCALER_PATH", str(PROJECT_ROOT / "models" / "scaler.pkl"))
    FEATURES_PATH: str = os.getenv("FEATURES_PATH", str(PROJECT_ROOT / "models" / "features.json"))
    DATA_PATH: str = os.getenv("DATA_PATH", str(PROJECT_ROOT / "lending_club.csv"))
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "100 per minute")
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.com")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin1234")

settings = Settings()
