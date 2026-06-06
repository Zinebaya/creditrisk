from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(256), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    
    # Roles: super_admin, enterprise_admin, enterprise_user
    # Legacy support: admin -> super_admin, client -> enterprise_admin, client_user -> enterprise_user
    role = Column(String(32), nullable=False, default="enterprise_user")
    
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Subscription fields (only for super_admin and enterprise_admin)
    subscription_status = Column(String(32), nullable=False, default="free")  # free|active|expired|canceled
    plan_tier = Column(String(32), nullable=False, default="free")  # free|pro|enterprise
    stripe_customer_id = Column(String(256), nullable=True)
    stripe_subscription_id = Column(String(256), nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)
    
    # Usage tracking fields
    monthly_predictions_used = Column(Integer, nullable=False, default=0)  # Count of predictions this month
    predictions_month_reset = Column(DateTime, nullable=True)  # When to reset monthly count
    
    # Multi-tenancy and profile fields
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)  # Reference to enterprise
    parent_id = Column(Integer, nullable=True)  # Legacy: References parent user (enterprise admin)
    
    first_name = Column(String(128), nullable=True)
    last_name = Column(String(128), nullable=True)
    phone = Column(String(64), nullable=True)
    wilaya = Column(String(128), nullable=True)
    address = Column(String(256), nullable=True)
    photo_url = Column(String(512), nullable=True)
    
    # Company fields (for enterprise_admin only)
    company_name = Column(String(190), nullable=True)
    company_sector = Column(String(128), nullable=True)

