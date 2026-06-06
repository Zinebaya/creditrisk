"""
Repayment tracking service
Manages loan repayment status, history, and timeline for client loans
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from models import Repayment, Client

class RepaymentService:
    """Service for managing loan repayments"""
    
    # Repayment status constants
    STATUS_REPAID = "remboursé"
    STATUS_IN_PROGRESS = "en_cours"
    STATUS_OVERDUE = "en_retard"
    STATUS_UNPAID = "impayé"
    
    VALID_STATUSES = {STATUS_REPAID, STATUS_IN_PROGRESS, STATUS_OVERDUE, STATUS_UNPAID}
    
    @staticmethod
    def create_repayment(
        session: Session,
        client_id: int,
        prediction_id: Optional[int],
        loan_amount: Optional[int] = None,
        due_date: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new repayment record for a loan"""
        
        repayment = Repayment(
            client_id=client_id,
            prediction_id=prediction_id,
            status="en_cours",
            loan_amount=loan_amount,
            paid_amount=0,
            due_date=due_date,
            notes=notes
        )
        session.add(repayment)
        session.flush()
        
        return RepaymentService._to_dict(repayment)
    
    @staticmethod
    def update_repayment_status(
        session: Session,
        repayment_id: int,
        status: str,
        paid_amount: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Update repayment status and payment info"""
        
        if status not in RepaymentService.VALID_STATUSES:
            raise ValueError(f"Invalid status: {status}")
        
        repayment = session.get(Repayment, repayment_id)
        if not repayment:
            return None
        
        repayment.status = status
        if paid_amount is not None:
            repayment.paid_amount = paid_amount
        if status == RepaymentService.STATUS_REPAID:
            repayment.last_payment_date = datetime.utcnow()
        repayment.updated_at = datetime.utcnow()
        
        session.flush()
        return RepaymentService._to_dict(repayment)
    
    @staticmethod
    def record_payment(
        session: Session,
        repayment_id: int,
        amount: int
    ) -> Optional[Dict[str, Any]]:
        """Record a payment for a loan"""
        
        repayment = session.get(Repayment, repayment_id)
        if not repayment:
            return None
        
        repayment.paid_amount += amount
        repayment.last_payment_date = datetime.utcnow()
        
        # Auto-update status if fully paid
        if repayment.loan_amount and repayment.paid_amount >= repayment.loan_amount:
            repayment.status = RepaymentService.STATUS_REPAID
        
        repayment.updated_at = datetime.utcnow()
        session.flush()
        return RepaymentService._to_dict(repayment)
    
    @staticmethod
    def get_repayment(session: Session, repayment_id: int) -> Optional[Dict[str, Any]]:
        """Get a single repayment record"""
        repayment = session.get(Repayment, repayment_id)
        return RepaymentService._to_dict(repayment) if repayment else None
    
    @staticmethod
    def get_client_repayments(
        session: Session,
        client_id: int
    ) -> List[Dict[str, Any]]:
        """Get all repayment records for a client"""
        repayments = session.execute(
            select(Repayment)
            .filter_by(client_id=client_id)
            .order_by(Repayment.created_at.desc())
        ).scalars().all()
        
        return [RepaymentService._to_dict(r) for r in repayments]
    
    @staticmethod
    def get_repayments_by_status(
        session: Session,
        enterprise_id: int,
        status: str
    ) -> List[Dict[str, Any]]:
        """Get repayments filtered by status for an enterprise"""
        
        if status not in RepaymentService.VALID_STATUSES:
            raise ValueError(f"Invalid status: {status}")
        
        # Join with clients to filter by enterprise
        repayments = session.execute(
            select(Repayment)
            .join(Client, Repayment.client_id == Client.id)
            .filter(Client.owner_id == enterprise_id)
            .filter(Repayment.status == status)
            .order_by(Repayment.created_at.desc())
        ).scalars().all()
        
        return [RepaymentService._to_dict(r) for r in repayments]
    
    @staticmethod
    def get_repayment_summary(
        session: Session,
        enterprise_id: int
    ) -> Dict[str, Any]:
        """Get summary of repayment statuses for an enterprise"""
        
        repayments = session.execute(
            select(Repayment)
            .join(Client, Repayment.client_id == Client.id)
            .filter(Client.owner_id == enterprise_id)
        ).scalars().all()
        
        summary = {
            "total": len(repayments),
            "remboursé": 0,
            "en_cours": 0,
            "en_retard": 0,
            "impayé": 0,
            "total_amount": 0,
            "paid_amount": 0,
            "remaining_amount": 0
        }
        
        for rep in repayments:
            summary[rep.status] += 1
            if rep.loan_amount:
                summary["total_amount"] += rep.loan_amount
                summary["paid_amount"] += rep.paid_amount
        
        summary["remaining_amount"] = summary["total_amount"] - summary["paid_amount"]
        
        return summary
    
    @staticmethod
    def _to_dict(repayment: Repayment) -> Dict[str, Any]:
        """Convert repayment object to dictionary"""
        return {
            "id": repayment.id,
            "client_id": repayment.client_id,
            "prediction_id": repayment.prediction_id,
            "status": repayment.status,
            "loan_amount": repayment.loan_amount,
            "paid_amount": repayment.paid_amount,
            "remaining_amount": (repayment.loan_amount or 0) - repayment.paid_amount if repayment.loan_amount else 0,
            "start_date": repayment.start_date.isoformat() if repayment.start_date else None,
            "due_date": repayment.due_date.isoformat() if repayment.due_date else None,
            "last_payment_date": repayment.last_payment_date.isoformat() if repayment.last_payment_date else None,
            "notes": repayment.notes,
            "created_at": repayment.created_at.isoformat() if repayment.created_at else None,
            "updated_at": repayment.updated_at.isoformat() if repayment.updated_at else None
        }
