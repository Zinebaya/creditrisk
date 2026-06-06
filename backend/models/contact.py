from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from .base import Base

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    
    # Contact info
    name = Column(String(256), nullable=False)
    email = Column(String(256), nullable=False, index=True)
    subject = Column(String(512), nullable=False)
    message = Column(Text, nullable=False)
    
    # Message type: "contact", "demo", "support"
    message_type = Column(String(32), nullable=False, default="contact")
    
    # Admin tracking
    is_read = Column(Boolean, nullable=False, default=False)
    read_at = Column(DateTime, nullable=True)
    
    # Response tracking
    response_message = Column(Text, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    responded_by_admin_id = Column(Integer, nullable=True)  # Admin who responded
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
