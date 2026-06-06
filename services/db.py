import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, Integer, String, Text, create_engine, func, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from supabase import Client, create_client

from config.config import settings

logger = logging.getLogger(__name__)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(256), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(50), nullable=False, default="client")
    plan_tier = Column(String(50), nullable=False, default="free")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(160), nullable=False)
    email = Column(String(256), nullable=False)
    phone = Column(String(32), nullable=False)
    wilaya = Column(String(80), nullable=False)
    city = Column(String(120), nullable=False)
    company = Column(String(160), nullable=True)
    sector = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    input_json = Column(JSON, nullable=False)
    prediction = Column(String(64), nullable=False)
    probability = Column(Float, nullable=False)
    decision = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LogEntry(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(128), nullable=False)
    subject = Column(String(256), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DatabaseService:
    def __init__(self, database_url: str, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.engine = create_engine(database_url, future=True, echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)
        Base.metadata.create_all(self.engine)
        self._ensure_schema()
        self.supabase: Optional[Client] = None
        
        # Use settings if not provided
        _supabase_url = supabase_url or settings.SUPABASE_URL
        _supabase_key = supabase_key or settings.SUPABASE_KEY
        
        if _supabase_url and _supabase_key:
            try:
                self.supabase = create_client(_supabase_url, _supabase_key)
            except Exception:
                logger.exception("supabase_client_initialization_failed")

    def _ensure_schema(self) -> None:
        inspector = inspect(self.engine)
        if "users" in inspector.get_table_names():
            existing = [col["name"] for col in inspector.get_columns("users")]
            with self.engine.connect() as connection:
                if "plan_tier" not in existing:
                    connection.execute(text("ALTER TABLE users ADD COLUMN plan_tier VARCHAR(50) NOT NULL DEFAULT 'free'"))
                if "is_active" not in existing:
                    connection.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))
                if "role" not in existing:
                    connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'client'"))
                connection.commit()
        if "clients" not in inspector.get_table_names():
            Base.metadata.create_all(self.engine, tables=[Client.__table__])

    def _session(self) -> Session:
        return self.SessionLocal()

    def _supabase_insert(self, table: str, payload: Dict[str, Any]) -> None:
        if not self.supabase:
            return
        try:
            self.supabase.table(table).insert(payload).execute()
        except Exception:
            logger.exception("supabase_insert_failed")

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._session() as session:
            user = session.query(User).filter(User.email == email).first()
            if not user:
                return None
            return {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "plan_tier": user.plan_tier,
                "is_active": bool(user.is_active),
                "password_hash": user.password_hash,
                "created_at": user.created_at.isoformat(),
            }

    def verify_user_password(self, email: str) -> Optional[str]:
        user = self.get_user_by_email(email)
        if not user:
            return None
        return user.get("password_hash")

    def list_users(self) -> List[Dict[str, Any]]:
        with self._session() as session:
            users = session.query(User).order_by(User.created_at.asc()).all()
            return [
                {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "plan_tier": user.plan_tier,
                    "is_active": bool(user.is_active),
                    "created_at": user.created_at.isoformat(),
                }
                for user in users
            ]

    def create_user(
        self,
        email: str,
        password_hash: str,
        role: str = "client",
        plan_tier: str = "free",
        is_active: bool = True,
    ) -> Dict[str, Any]:
        with self._session() as session:
            user = User(email=email, password_hash=password_hash, role=role, plan_tier=plan_tier, is_active=is_active)
            session.add(user)
            try:
                session.commit()
            except IntegrityError as exc:
                session.rollback()
                logger.exception("create_user_integrity_error")
                raise ValueError("User already exists") from exc
            payload = {
                "email": email,
                "role": role,
                "plan_tier": plan_tier,
                "is_active": is_active,
                "created_at": user.created_at.isoformat(),
            }
            self._supabase_insert("users", payload)
            return {
                "id": user.id,
                "email": email,
                "role": role,
                "plan_tier": plan_tier,
                "is_active": is_active,
                "created_at": user.created_at.isoformat(),
            }

    def update_user(
        self,
        user_id: int,
        password_hash: Optional[str] = None,
        role: Optional[str] = None,
        plan_tier: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        with self._session() as session:
            user = session.get(User, user_id)
            if not user:
                raise ValueError("User not found")

            if password_hash:
                user.password_hash = password_hash
            if role:
                user.role = role
            if plan_tier:
                user.plan_tier = plan_tier
            if is_active is not None:
                user.is_active = is_active
            session.commit()
            return {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "plan_tier": user.plan_tier,
                "is_active": bool(user.is_active),
                "created_at": user.created_at.isoformat(),
            }

    def ensure_default_admin(self, email: str, password_hash: str, role: str = "admin") -> None:
        existing = self.get_user_by_email(email)
        if existing:
            needs_update = False
            if existing.get("role") != role:
                needs_update = True
            if existing.get("plan_tier") != "unlimited":
                needs_update = True
            if not existing.get("is_active", True):
                needs_update = True
            if not existing.get("password_hash", "").startswith("$2"):
                needs_update = True

            if needs_update:
                try:
                    self.update_user(
                        existing["id"],
                        password_hash=password_hash,
                        role=role,
                        plan_tier="unlimited",
                        is_active=True,
                    )
                    logger.info("default_admin_updated", extra={"email": email})
                except ValueError:
                    logger.exception("default_admin_update_failed", extra={"email": email})
            return

        try:
            self.create_user(email, password_hash, role, plan_tier="unlimited", is_active=True)
            logger.info("default_admin_created", extra={"email": email})
        except ValueError:
            pass

    def log_prediction(self, user_id: Optional[int], input_json: Dict[str, Any], prediction: str, probability: float, decision: str) -> None:
        with self._session() as session:
            record = Prediction(user_id=user_id, input_json=input_json, prediction=prediction, probability=probability, decision=decision)
            session.add(record)
            session.commit()

        payload = {
            "user_id": user_id,
            "input_json": input_json,
            "prediction": prediction,
            "probability": probability,
            "decision": decision,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self._supabase_insert("predictions", payload)

    def log_action(self, action: str, subject: str, details: Optional[Dict[str, Any]] = None) -> None:
        with self._session() as session:
            entry = LogEntry(action=action, subject=subject, details=details or {})
            session.add(entry)
            session.commit()

        self._supabase_insert("logs", {"action": action, "subject": subject, "details": details or {}, "created_at": datetime.utcnow().isoformat()})

    def list_clients(self) -> List[Dict[str, Any]]:
        with self._session() as session:
            clients = session.query(Client).order_by(Client.created_at.desc()).all()
            return [
                {
                    "id": client.id,
                    "name": client.name,
                    "email": client.email,
                    "phone": client.phone,
                    "wilaya": client.wilaya,
                    "city": client.city,
                    "company": client.company,
                    "sector": client.sector,
                    "created_at": client.created_at.isoformat(),
                }
                for client in clients
            ]

    def create_client(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        with self._session() as session:
            client = Client(
                name=payload["name"],
                email=payload["email"],
                phone=payload["phone"],
                wilaya=payload["wilaya"],
                city=payload["city"],
                company=payload.get("company"),
                sector=payload.get("sector"),
            )
            session.add(client)
            session.commit()
            return {
                "id": client.id,
                "name": client.name,
                "email": client.email,
                "phone": client.phone,
                "wilaya": client.wilaya,
                "city": client.city,
                "company": client.company,
                "sector": client.sector,
                "created_at": client.created_at.isoformat(),
            }

    def delete_client(self, client_id: int) -> None:
        with self._session() as session:
            client = session.get(Client, client_id)
            if not client:
                raise ValueError("Client not found")
            session.delete(client)
            session.commit()

    def toggle_user_active(self, user_id: int) -> Dict[str, Any]:
        with self._session() as session:
            user = session.get(User, user_id)
            if not user:
                raise ValueError("User not found")
            user.is_active = not bool(user.is_active)
            session.commit()
            return {
                "id": user.id,
                "email": user.email,
                "is_active": bool(user.is_active),
            }

    def update_user_role(self, user_id: int, role: str) -> Dict[str, Any]:
        return self.update_user(user_id, role=role)

    def update_user_plan(self, user_id: int, plan_tier: str) -> Dict[str, Any]:
        return self.update_user(user_id, plan_tier=plan_tier)

    def delete_user(self, user_id: int) -> None:
        with self._session() as session:
            user = session.get(User, user_id)
            if not user:
                raise ValueError("User not found")
            session.delete(user)
            session.commit()

    def fetch_admin_stats(self) -> Dict[str, Any]:
        with self._session() as session:
            total_users = int(session.query(func.count(User.id)).scalar() or 0)
            total_clients = int(session.query(func.count(User.id)).filter(User.role == "client").scalar() or 0)
            total_predictions = int(session.query(func.count(Prediction.id)).scalar() or 0)
            active_subscriptions = int(
                session.query(func.count(User.id))
                .filter(User.plan_tier.in_(["pro", "enterprise", "unlimited"]), User.is_active == True)
                .scalar() or 0
            )
            high_risk_cases = int(
                session.query(func.count(Prediction.id)).filter(Prediction.prediction == "high_risk").scalar() or 0
            )
            plan_rows = session.query(User.plan_tier, func.count(User.id)).group_by(User.plan_tier).all()
            role_rows = session.query(User.role, func.count(User.id)).group_by(User.role).all()
            active_rows = session.query(User.is_active, func.count(User.id)).group_by(User.is_active).all()
            recent_predictions = session.query(func.count(Prediction.id)).filter(
                Prediction.created_at >= datetime.utcnow() - timedelta(days=7)
            ).scalar() or 0
            prediction_rows = (
                session.query(Prediction.created_at)
                .order_by(Prediction.created_at.desc())
                .all()
            )
            monthly_map = {}
            for (created_at,) in prediction_rows:
                if not created_at:
                    continue
                key = created_at.strftime("%b %Y")
                monthly_map[key] = monthly_map.get(key, 0) + 1

            monthly_predictions = [
                {"month": month, "count": count}
                for month, count in sorted(monthly_map.items(), key=lambda x: datetime.strptime(x[0], "%b %Y"))
            ]
            active_count = int(next((row[1] for row in active_rows if row[0] == True), 0))
            inactive_count = int(next((row[1] for row in active_rows if row[0] == False), 0))

            return {
                "total_users": total_users,
                "total_clients": total_clients,
                "total_predictions": total_predictions,
                "active_subscriptions": active_subscriptions,
                "high_risk_cases": high_risk_cases,
                "plan_distribution": {row[0] or "free": int(row[1]) for row in plan_rows},
                "role_distribution": {row[0] or "client": int(row[1]) for row in role_rows},
                "active_distribution": {"active": active_count, "inactive": inactive_count},
                "recent_predictions_week": int(recent_predictions),
                "monthly_predictions": monthly_predictions,
            }

    def fetch_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self._session() as session:
            entries = session.query(LogEntry).order_by(LogEntry.created_at.desc()).limit(limit).all()
            return [
                {
                    "id": entry.id,
                    "action": entry.action,
                    "subject": entry.subject,
                    "details": entry.details,
                    "created_at": entry.created_at.isoformat(),
                }
                for entry in entries
            ]

    def fetch_predictions(
        self,
        user_id: Optional[int] = None,
        limit: Optional[int] = 100,
        include_user_email: bool = False,
    ) -> List[Dict[str, Any]]:
        with self._session() as session:
            if include_user_email:
                rows = (
                    session.query(Prediction, User.email.label("user_email"))
                    .outerjoin(User, Prediction.user_id == User.id)
                    .order_by(Prediction.created_at.desc())
                )
            else:
                rows = session.query(Prediction).order_by(Prediction.created_at.desc())

            if user_id is not None:
                rows = rows.filter(Prediction.user_id == user_id)

            if limit is not None:
                rows = rows.limit(limit)
            results = rows.all()
            output = []
            for item in results:
                if include_user_email:
                    record, user_email = item
                else:
                    record = item
                    user_email = None
                output.append(
                    {
                        "id": record.id,
                        "user_id": record.user_id,
                        "user_email": user_email,
                        "input_json": record.input_json,
                        "prediction": record.prediction,
                        "probability": record.probability,
                        "decision": record.decision,
                        "created_at": record.created_at.isoformat(),
                    }
                )
            return output

    def fetch_analytics(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        with self._session() as session:
            query = session.query(Prediction)
            if user_id is not None:
                query = query.filter(Prediction.user_id == user_id)

            total = query.count()
            average = query.with_entities(func.avg(Prediction.probability)).scalar() or 0.0
            distribution = query.with_entities(Prediction.prediction, func.count(Prediction.id)).group_by(Prediction.prediction).all()
            monthly_records = (
                query.with_entities(Prediction.created_at)
                .order_by(Prediction.created_at.desc())
                .all()
            )

            monthly_map = {}
            for (created_at,) in monthly_records:
                key = created_at.strftime("%b %Y")
                monthly_map[key] = monthly_map.get(key, 0) + 1

            sorted_monthly = sorted(monthly_map.items(), key=lambda x: datetime.strptime(x[0], "%b %Y"))
            monthly_predictions = [{"month": month, "count": count} for month, count in sorted_monthly]

            return {
                "total_predictions": int(total),
                "average_probability": float(round(float(average), 4)),
                "risk_distribution": {row[0]: int(row[1]) for row in distribution},
                "monthly_predictions": monthly_predictions,
            }

    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        with self._session() as session:
            user = session.get(User, user_id)
            if not user:
                return None
            return {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "plan_tier": user.plan_tier,
                "is_active": bool(user.is_active),
                "created_at": user.created_at.isoformat(),
            }
