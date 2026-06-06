from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from .base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="DZD")
    payment_method = Column(String(50), nullable=False)
    plan_id = Column(String(50), nullable=False)
    billing_period = Column(String(20), nullable=False, default="monthly")
    status = Column(String(20), nullable=False, default="pending")
    transaction_id = Column(String(256), nullable=True)
    receipt_url = Column(String(512), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)