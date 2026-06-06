from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from .base import Base

class Enterprise(Base):
    """
    Represents a company/enterprise using the platform.
    This is a client company (bank, credit organization, financing company).
    """
    __tablename__ = "enterprises"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic information
    name = Column(String(256), nullable=False, index=True)
    sector = Column(String(128), nullable=False)  # bank, credit_organization, financing_company
    
    # Contact information
    email = Column(String(256), nullable=False, unique=True, index=True)
    phone = Column(String(32), nullable=False)
    address = Column(String(512), nullable=True)
    wilaya = Column(String(128), nullable=True)  # Algerian wilaya
    city = Column(String(120), nullable=True)
    
    # Registration and status
    subscription_status = Column(String(32), nullable=False, default="free")  # free|active|expired|canceled
    plan_tier = Column(String(32), nullable=False, default="free")  # free|monthly|annual|enterprise
    subscription_expires_at = Column(DateTime, nullable=True)
    
    # Stripe integration
    stripe_customer_id = Column(String(256), nullable=True)
    stripe_subscription_id = Column(String(256), nullable=True)
    
    # Usage tracking
    total_users = Column(Integer, nullable=False, default=1)
    total_predictions = Column(Integer, nullable=False, default=0)
    total_clients = Column(Integer, nullable=False, default=0)
    
    # Enterprise admin user (reference to User table)
    admin_id = Column(Integer, nullable=True)
    
    # Additional info
    description = Column(Text, nullable=True)
    logo_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
