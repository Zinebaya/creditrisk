"""SQLAlchemy models for Credit Risk SaaS platform."""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(256), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(50), nullable=False, default="client")
    is_active = Column(Boolean, nullable=False, default=True)
    last_login_at = Column(DateTime, nullable=True)
    
    plan_tier = Column(String(50), nullable=False, default="free")
    subscription_status = Column(String(50), nullable=False, default="active")
    stripe_customer_id = Column(String(256), nullable=True)
    stripe_subscription_id = Column(String(256), nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)
    
    monthly_predictions_used = Column(Integer, nullable=False, default=0)
    predictions_month_reset = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(160), nullable=False)
    email = Column(String(256), nullable=False, index=True)
    phone = Column(String(32), nullable=False)
    wilaya = Column(String(80), nullable=False)
    city = Column(String(120), nullable=False)
    company = Column(String(160), nullable=True)
    sector = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    input_json = Column(JSON, nullable=False)
    prediction = Column(String(64), nullable=False)
    probability = Column(Float, nullable=False)
    decision = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class LogEntry(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(128), nullable=False)
    subject = Column(String(256), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

__all__ = ["Base", "User", "Client", "Prediction", "LogEntry"]
