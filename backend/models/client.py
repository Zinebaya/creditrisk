from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .base import Base
class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    first_name = Column(String(160), nullable=True)
    gender = Column(String(32), nullable=True)
    email = Column(String(256), nullable=False)
    phone = Column(String(32), nullable=False)
    address = Column(String(512), nullable=True)
    wilaya = Column(String(80), nullable=False)
    city = Column(String(120), nullable=False)
    sector = Column(String(160), nullable=True)
    repayment_status = Column(String(64), nullable=False, default="Crédit en cours")
    notes = Column(String(2000), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
