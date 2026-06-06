from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from .base import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(64), nullable=False)
    metrics = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
