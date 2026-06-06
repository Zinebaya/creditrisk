from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from .base import Base
class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    client_id = Column(Integer, nullable=True)
    input_json = Column(JSON, nullable=False)
    prediction = Column(String(32), nullable=False)
    probability = Column(Float, nullable=False)
    decision = Column(String(32), nullable=False)
    explanation = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
