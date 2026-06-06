from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .base import Base

class Repayment(Base):
    """
    Tracks the repayment status of loans given to clients.
    Maintains history of status changes for each client prediction.
    """
    __tablename__ = "repayments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Link to the client and prediction
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True, index=True)
    
    # Repayment tracking
    status = Column(String(32), nullable=False, default="en_cours")  
    # Statuses: remboursé, en_cours, en_retard, impayé
    
    loan_amount = Column(Integer, nullable=True)  # Amount in DA (Dinars)
    paid_amount = Column(Integer, nullable=False, default=0)  # Amount paid so far
    
    # Dates
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    last_payment_date = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(String(1000), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
