from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from .base import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(128), nullable=False)
    level = Column(String(32), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
