import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BASE_DIR.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BASE_DIR / ".env", override=False)

def rel(value: str) -> str:
    if value.startswith("sqlite:///"):
        db_path = value.replace("sqlite:///", "", 1)
        if not Path(db_path).is_absolute():
            return "sqlite:///" + str(ROOT_DIR / db_path).replace("\\", "/")
    return value

@dataclass
class Settings:
    DATABASE_URL: str = rel(os.getenv("DATABASE_URL", "postgresql://postgres.xzcavjumobxmrfnqsafi:Gx9%23Ar%2FLPB-E*aN@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"))
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "please-change-this-secret")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "please-set-a-secret")
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "100 per minute")
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(ROOT_DIR / "models" / "model.pkl"))
    SCALER_PATH: str = os.getenv("SCALER_PATH", str(ROOT_DIR / "models" / "scaler.pkl"))
    FEATURES_PATH: str = os.getenv("FEATURES_PATH", str(ROOT_DIR / "models" / "features.json"))
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.com")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin1234")
    LOG_DIR: str = os.getenv("LOG_DIR", str(ROOT_DIR / "logs"))
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
settings = Settings()
