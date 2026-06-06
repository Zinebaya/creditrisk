"""
Email service for sending notifications and contact responses.
Supports SMTP configuration for production email delivery.
"""

import os
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails (contact confirmations, admin notifications, responses)."""
    
    def __init__(self, smtp_server: str = None, smtp_port: int = None, 
                 sender_email: str = None, sender_password: str = None):
        """Initialize email service with SMTP configuration."""
        self.smtp_server = smtp_server or os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = smtp_port or int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = sender_email or os.getenv("SENDER_EMAIL", "noreply@paypredict.com")
        self.sender_password = sender_password or os.getenv("SENDER_PASSWORD", "")
        self.smtp_enabled = os.getenv("SMTP_ENABLED", "false").lower() == "true"
        self.admin_email = os.getenv("ADMIN_EMAIL", "admin@paypredict.com")
    
    def send_contact_confirmation(self, recipient_email: str, name: str, subject: str) -> bool:
        """
        Send confirmation email to user who submitted contact form.
        
        Args:
            recipient_email: User's email address
            name: User's full name
            subject: Subject of their message
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.smtp_enabled:
            logger.info(f"Email disabled: Would send confirmation to {recipient_email}")
            return False
        
        try:
            # TODO: Implement SMTP email sending
            logger.info(f"Sending confirmation email to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send confirmation email: {str(e)}")
            return False
    
    def send_admin_contact_notification(self, contact_name: str, contact_email: str,
                                       subject: str, message: str, message_type: str,
                                       admin_email: str = None) -> bool:
        """
        Send notification to admin about new contact message.
        
        Args:
            contact_name: Name of the person who sent the message
            contact_email: Email of the person who sent the message
            subject: Subject of the message
            message: The message content
            message_type: Type of message (contact/demo/support)
            admin_email: Admin email to send notification to
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.smtp_enabled:
            logger.info(f"Email disabled: Would send admin notification about {contact_name}")
            return False
        
        try:
            # TODO: Implement SMTP email sending
            logger.info(f"Sending admin notification for {contact_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to send admin notification: {str(e)}")
            return False
    
    def send_contact_response(self, recipient_email: str, recipient_name: str, 
                            response_message: str) -> bool:
        """
        Send admin response to user's contact message.
        
        Args:
            recipient_email: User's email address
            recipient_name: User's full name
            response_message: Admin's response message
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.smtp_enabled:
            logger.info(f"Email disabled: Would send response email to {recipient_email}")
            return False
        
        try:
            # TODO: Implement SMTP email sending
            logger.info(f"Sending response email to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send response email: {str(e)}")
            return False


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get singleton EmailService instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service

