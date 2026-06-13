import logging
from contextlib import contextmanager
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine, select, func
from sqlalchemy.pool import NullPool
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from models import Base, User, Client, Prediction, Log, ModelVersion, Enterprise, Repayment, Payment
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DatabaseService:
    _instance = None

    def __new__(cls, database_url: str, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(DatabaseService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, database_url: str):
        if getattr(self, "_initialized", False):
            return
        if database_url.startswith("sqlite"):
            self.engine = create_engine(database_url, future=True)
        else:
            self.engine = create_engine(
                database_url,
                future=True,
                pool_size=10,
                max_overflow=20,
                pool_recycle=300,
                pool_pre_ping=True
            )
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)
        self._migrate_sqlite()
        Base.metadata.create_all(self.engine)
        self._initialized = True

    def _migrate_sqlite(self) -> None:
        """Migrate SQLite schema to add missing columns without data loss."""
        if self.engine.dialect.name != "sqlite":
            return
        
        with self.engine.begin() as conn:
            # Check existing tables
            tables = {row[0] for row in conn.exec_driver_sql("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
            
            # Create enterprises table if missing
            if "enterprises" not in tables:
                try:
                    conn.exec_driver_sql("""
                        CREATE TABLE enterprises (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name VARCHAR(256) NOT NULL,
                            sector VARCHAR(128) NOT NULL,
                            email VARCHAR(256) NOT NULL UNIQUE,
                            phone VARCHAR(32) NOT NULL,
                            address VARCHAR(512),
                            wilaya VARCHAR(128),
                            city VARCHAR(120),
                            subscription_status VARCHAR(32) NOT NULL DEFAULT 'free',
                            plan_tier VARCHAR(32) NOT NULL DEFAULT 'free',
                            subscription_expires_at DATETIME,
                            stripe_customer_id VARCHAR(256),
                            stripe_subscription_id VARCHAR(256),
                            total_users INTEGER NOT NULL DEFAULT 1,
                            total_predictions INTEGER NOT NULL DEFAULT 0,
                            total_clients INTEGER NOT NULL DEFAULT 0,
                            admin_id INTEGER,
                            description TEXT,
                            logo_url VARCHAR(512),
                            is_active BOOLEAN NOT NULL DEFAULT 1,
                            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    logger.info("Created enterprises table")
                except Exception as e:
                    logger.warning(f"Could not create enterprises table: {e}")
            
            # Create repayments table if missing
            if "repayments" not in tables:
                try:
                    conn.exec_driver_sql("""
                        CREATE TABLE repayments (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            client_id INTEGER NOT NULL,
                            prediction_id INTEGER,
                            status VARCHAR(32) NOT NULL DEFAULT 'en_cours',
                            loan_amount INTEGER,
                            paid_amount INTEGER NOT NULL DEFAULT 0,
                            start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            due_date DATETIME,
                            last_payment_date DATETIME,
                            notes VARCHAR(1000),
                            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (client_id) REFERENCES clients(id),
                            FOREIGN KEY (prediction_id) REFERENCES predictions(id)
                        )
                    """)
                    logger.info("Created repayments table")
                except Exception as e:
                    logger.warning(f"Could not create repayments table: {e}")
            
            # Migrate users table
            if "users" in tables:
                cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()}
                # Add missing columns to users
                missing_cols = {
                    ("is_active", "BOOLEAN NOT NULL DEFAULT 1"),
                    ("subscription_status", "VARCHAR(32) NOT NULL DEFAULT 'free'"),
                    ("plan_tier", "VARCHAR(32) NOT NULL DEFAULT 'free'"),
                    ("stripe_customer_id", "VARCHAR(256)"),
                    ("stripe_subscription_id", "VARCHAR(256)"),
                    ("subscription_expires_at", "DATETIME"),
                    ("monthly_predictions_used", "INTEGER NOT NULL DEFAULT 0"),
                    ("predictions_month_reset", "DATETIME"),
                    ("enterprise_id", "INTEGER"),
                    ("parent_id", "INTEGER"),
                    ("first_name", "VARCHAR(128)"),
                    ("last_name", "VARCHAR(128)"),
                    ("phone", "VARCHAR(64)"),
                    ("wilaya", "VARCHAR(128)"),
                    ("address", "VARCHAR(256)"),
                    ("photo_url", "VARCHAR(512)"),
                    ("company_name", "VARCHAR(190)"),
                    ("company_sector", "VARCHAR(128)"),
                }
                for col_name, col_def in missing_cols:
                    if col_name not in cols:
                        try:
                            conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                            logger.info(f"Added column {col_name} to users table")
                        except Exception as e:
                            logger.warning(f"Could not add {col_name} to users: {e}")

            
            # Clean up predictions table if exists but incomplete
            if "predictions" in tables:
                cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(predictions)").fetchall()}
                required = {"id", "user_id", "client_id", "input_json", "prediction", "probability", "decision", "explanation", "created_at"}
                if not required.issubset(cols):
                    conn.exec_driver_sql("DROP TABLE predictions")
            
            # Migrate clients table: add owner_id if missing and new fields
            if "clients" in tables:
                cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(clients)").fetchall()}
                required = {"id", "name", "email", "phone", "wilaya", "city", "created_at"}
                if not required.issubset(cols):
                    conn.exec_driver_sql("DROP TABLE clients")
                else:
                    if "owner_id" not in cols:
                        try:
                            conn.exec_driver_sql("ALTER TABLE clients ADD COLUMN owner_id INTEGER REFERENCES users(id)")
                            logger.info("Added column owner_id to clients table")
                        except Exception as e:
                            logger.warning(f"Could not add owner_id to clients: {e}")
                    
                    missing_client_cols = {
                        ("first_name", "VARCHAR(160)"),
                        ("gender", "VARCHAR(32)"),
                        ("address", "VARCHAR(512)"),
                        ("sector", "VARCHAR(160)"),
                        ("repayment_status", "VARCHAR(64) NOT NULL DEFAULT 'Crédit en cours'"),
                        ("notes", "VARCHAR(2000)"),
                    }
                    for col_name, col_def in missing_client_cols:
                        if col_name not in cols:
                            try:
                                conn.exec_driver_sql(f"ALTER TABLE clients ADD COLUMN {col_name} {col_def}")
                                logger.info(f"Added column {col_name} to clients table")
                            except Exception as e:
                                logger.warning(f"Could not add {col_name} to clients: {e}")

    @contextmanager
    def session(self):
        session = self.SessionLocal()
        try:
            yield session; session.commit()
        except Exception:
            session.rollback(); raise
        finally:
            session.close()

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self.session() as s:
            u = s.execute(select(User).filter_by(email=email.lower())).scalar_one_or_none()
            return None if not u else {
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "password_hash": u.password_hash,
                "plan_tier": u.plan_tier,
                "subscription_status": u.subscription_status,
                "monthly_predictions_used": u.monthly_predictions_used,
                "parent_id": u.parent_id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone": u.phone,
                "wilaya": u.wilaya,
                "address": u.address,
                "photo_url": u.photo_url,
                "company_name": u.company_name,
                "company_sector": u.company_sector,
                "created_at": u.created_at.isoformat()
            }

    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        with self.session() as s:
            u = s.get(User, user_id)
            return None if not u else {
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "plan_tier": u.plan_tier,
                "subscription_status": u.subscription_status,
                "monthly_predictions_used": u.monthly_predictions_used,
                "parent_id": u.parent_id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone": u.phone,
                "wilaya": u.wilaya,
                "address": u.address,
                "photo_url": u.photo_url,
                "company_name": u.company_name,
                "company_sector": u.company_sector,
                "created_at": u.created_at.isoformat()
            }

    def list_users(self) -> List[Dict[str, Any]]:
        with self.session() as s:
            rows = s.execute(select(User).order_by(User.created_at.asc())).scalars().all()
            return [{
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "plan_tier": u.plan_tier,
                "subscription_status": u.subscription_status,
                "monthly_predictions_used": u.monthly_predictions_used,
                "parent_id": u.parent_id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone": u.phone,
                "wilaya": u.wilaya,
                "address": u.address,
                "photo_url": u.photo_url,
                "company_name": u.company_name,
                "company_sector": u.company_sector,
                "created_at": u.created_at.isoformat()
            } for u in rows]

    def create_user(self, email: str, password_hash: str, role: str="admin", plan_tier: str="free", is_active: bool=True, parent_id: int=None, first_name: str=None, last_name: str=None, phone: str=None, wilaya: str=None, address: str=None, photo_url: str=None, company_name: str=None, company_sector: str=None) -> Dict[str, Any]:
        with self.session() as s:
            u = User(
                email=email.lower(),
                password_hash=password_hash,
                role=role,
                plan_tier=plan_tier,
                is_active=is_active,
                parent_id=parent_id,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                wilaya=wilaya,
                address=address,
                photo_url=photo_url,
                company_name=company_name,
                company_sector=company_sector
            ); s.add(u)
            try: s.flush()
            except IntegrityError as exc: raise ValueError("User already exists") from exc
            return {
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "plan_tier": u.plan_tier,
                "is_active": u.is_active,
                "parent_id": u.parent_id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "created_at": u.created_at.isoformat()
            }

    def verify_user_password(self, email: str) -> Optional[str]:
        with self.session() as s:
            u = s.execute(select(User).filter_by(email=email.lower())).scalar_one_or_none()
            return u.password_hash if u else None

    def ensure_default_admin(self, email: str, password_hash: str) -> None:
        with self.session() as s:
            u = s.execute(select(User).filter_by(email=email.lower())).scalar_one_or_none()
            if u:
                u.password_hash = password_hash
                u.role = "admin"
            else:
                s.add(User(email=email.lower(), password_hash=password_hash, role="admin"))

    def list_clients(self, owner_id: int = None) -> List[Dict[str, Any]]:
        with self.session() as s:
            q = select(Client).order_by(Client.created_at.desc())
            if owner_id is not None:
                q = q.filter_by(owner_id=owner_id)
            rows = s.execute(q).scalars().all()
            return [{
                "id": c.id,
                "name": c.name,
                "first_name": c.first_name,
                "gender": c.gender,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "wilaya": c.wilaya,
                "city": c.city,
                "sector": c.sector,
                "repayment_status": c.repayment_status,
                "notes": c.notes,
                "owner_id": c.owner_id,
                "created_at": c.created_at.isoformat()
            } for c in rows]

    def create_client(self, data: Dict[str, Any], owner_id: int = None) -> Dict[str, Any]:
        with self.session() as s:
            c = Client(
                name=data["name"],
                first_name=data.get("first_name"),
                gender=data.get("gender"),
                email=data["email"],
                phone=data["phone"],
                address=data.get("address"),
                wilaya=data["wilaya"],
                city=data["city"],
                sector=data.get("sector"),
                repayment_status=data.get("repayment_status", "Crédit en cours"),
                notes=data.get("notes"),
                owner_id=owner_id
            ); s.add(c); s.flush()
            return {
                "id": c.id,
                "name": c.name,
                "first_name": c.first_name,
                "gender": c.gender,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "wilaya": c.wilaya,
                "city": c.city,
                "sector": c.sector,
                "repayment_status": c.repayment_status,
                "notes": c.notes,
                "owner_id": c.owner_id,
                "created_at": c.created_at.isoformat()
            }

    def update_client(self, client_id: int, data: Dict[str, Any], owner_id: int = None) -> Optional[Dict[str, Any]]:
        with self.session() as s:
            c = s.get(Client, client_id)
            if not c:
                return None
            if owner_id is not None and c.owner_id != owner_id:
                raise ValueError("Unauthorized to update this client")
            
            if "name" in data: c.name = data["name"]
            if "first_name" in data: c.first_name = data["first_name"]
            if "gender" in data: c.gender = data["gender"]
            if "email" in data: c.email = data["email"]
            if "phone" in data: c.phone = data["phone"]
            if "address" in data: c.address = data["address"]
            if "wilaya" in data: c.wilaya = data["wilaya"]
            if "city" in data: c.city = data["city"]
            if "sector" in data: c.sector = data["sector"]
            if "repayment_status" in data: c.repayment_status = data["repayment_status"]
            if "notes" in data: c.notes = data["notes"]
            
            s.flush()
            return {
                "id": c.id,
                "name": c.name,
                "first_name": c.first_name,
                "gender": c.gender,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "wilaya": c.wilaya,
                "city": c.city,
                "sector": c.sector,
                "repayment_status": c.repayment_status,
                "notes": c.notes,
                "owner_id": c.owner_id,
                "created_at": c.created_at.isoformat()
            }

    def delete_client(self, client_id: int, owner_id: int = None) -> None:
        with self.session() as s:
            c = s.get(Client, client_id)
            if c:
                if owner_id is not None and c.owner_id != owner_id:
                    raise ValueError("Unauthorized to delete this client")
                s.delete(c)

    def client_exists(self, client_id: int) -> bool:
        with self.session() as s: 
            return s.get(Client, client_id) is not None

    def create_prediction(self, user_id: Optional[int], input_json: Dict[str, Any], prediction: str, probability: float, decision: str, explanation: Dict[str, Any], client_id: Optional[int]=None):
        with self.session() as s: 
            s.add(Prediction(user_id=user_id, client_id=client_id, input_json=input_json, prediction=prediction, probability=probability, decision=decision, explanation=explanation))

    def get_predictions(self, user_id: Optional[int]=None, limit: int=100) -> List[Dict[str, Any]]:
        with self.session() as s:
            q = select(Prediction).order_by(Prediction.created_at.desc()).limit(limit)
            if user_id is not None: 
                q = q.filter_by(user_id=user_id)
            rows = s.execute(q).scalars().all()
            return [{"id": p.id, "user_id": p.user_id, "client_id": p.client_id, "input_json": p.input_json, "prediction": p.prediction, "probability": p.probability, "decision": p.decision, "explanation": p.explanation, "created_at": p.created_at.isoformat()} for p in rows]

    def get_analytics(self) -> Dict[str, Any]:
        with self.session() as s:
            total = s.execute(select(func.count(Prediction.id))).scalar_one() or 0
            avg = s.execute(select(func.avg(Prediction.probability))).scalar_one() or 0.0
            dist = s.execute(select(Prediction.prediction, func.count(Prediction.id)).group_by(Prediction.prediction)).all()
            dialect = s.bind.dialect.name
            month_expr = func.strftime('%Y-%m', Prediction.created_at) if dialect=="sqlite" else func.to_char(Prediction.created_at, 'YYYY-MM')
            monthly = s.execute(select(month_expr, func.count(Prediction.id)).group_by(month_expr).order_by(month_expr)).all()
            return {"total_predictions": int(total), "average_probability": float(avg), "risk_distribution": {r[0]: int(r[1]) for r in dist}, "monthly_predictions": [{"month": r[0], "count": int(r[1])} for r in monthly]}

    def log_action(self, action: str, level: str="info", details: Optional[Dict[str, Any]]=None):
        with self.session() as s: 
            s.add(Log(action=action, level=level, details=details or {}))

    def create_model_version(self, version: str, metrics: Dict[str, Any]):
        with self.session() as s: 
            s.add(ModelVersion(version=version, metrics=metrics))

    def get_user_model_by_email(self, email: str) -> Optional[User]:
        """Get user object by email (for Stripe operations)."""
        with self.session() as s:
            return s.execute(select(User).filter_by(email=email.lower())).scalar_one_or_none()

    def update_user_subscription(
        self,
        user_id: int,
        subscription_status: str = None,
        plan_tier: str = None,
        stripe_customer_id: str = None,
        stripe_subscription_id: str = None,
        subscription_expires_at = None,
    ) -> bool:
        """Update user subscription fields after payment."""
        with self.session() as s:
            user = s.get(User, user_id)
            if not user:
                return False
            if subscription_status:
                user.subscription_status = subscription_status
            if plan_tier:
                user.plan_tier = plan_tier
            if stripe_customer_id:
                user.stripe_customer_id = stripe_customer_id
            if stripe_subscription_id:
                user.stripe_subscription_id = stripe_subscription_id
            if subscription_expires_at:
                user.subscription_expires_at = subscription_expires_at
            return True

    def check_prediction_limit(self, user_id: int) -> Dict[str, Any]:
        """Check if user has reached their prediction limit."""
        with self.session() as s:
            user = s.get(User, user_id)
            if not user:
                return {"allowed": True, "remaining": None, "limit_reached": False, "used": 0, "limit": None}
            
            if user.plan_tier in ("pro", "enterprise", "unlimited"):
                return {"allowed": True, "remaining": None, "limit_reached": False, "used": user.monthly_predictions_used, "limit": None}
            
            limit = 3
            used = user.monthly_predictions_used
            remaining = max(0, limit - used)
            limit_reached = used >= limit
            
            return {
                "allowed": not limit_reached,
                "remaining": remaining,
                "limit_reached": limit_reached,
                "used": used,
                "limit": limit
            }

    def track_prediction(self, user_id: int) -> bool:
        """Increment prediction count for the month."""
        with self.session() as s:
            user = s.get(User, user_id)
            if not user:
                return False
            user.monthly_predictions_used += 1
            s.commit()
            return True
    
    def update_user_role(self, user_id: int, role: str) -> bool:
        """Update user role."""
        with self.session() as s:
            user = s.get(User, user_id)
            if not user:
                return False
            user.role = role
            s.commit()
            return True
    
    def update_user_plan(self, user_id: int, plan_tier: str) -> bool:
        """Update user plan tier."""
        with self.session() as s:
            user = s.get(User, user_id)
            if not user:
                return False
            user.plan_tier = plan_tier
            s.commit()
            return True
    
    def delete_user(self, user_id: int) -> bool:
        """Delete user."""
        with self.session() as s:
            user = s.get(User, user_id)
            if not user:
                return False
            s.delete(user)
            s.commit()
            return True
    
    def fetch_predictions(self, user_id: int = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch predictions for user (alias for get_predictions)."""
        return self.get_predictions(user_id, limit)
    
    def fetch_analytics(self) -> Dict[str, Any]:
        """Fetch analytics (alias for get_analytics)."""
        return self.get_analytics()
    
    def fetch_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch logs."""
        with self.session() as s:
            rows = s.execute(select(Log).order_by(Log.created_at.desc()).limit(limit)).scalars().all()
            return [{"action": l.action, "level": l.level, "details": l.details, "created_at": l.created_at.isoformat()} for l in rows]
    
    def log_prediction(self, user_id: int, input_json: Dict[str, Any], prediction: str, probability: float, decision: str, explanation: Dict[str, Any] = None, client_id: int = None):
        """Log prediction (alias for create_prediction)."""
        self.create_prediction(user_id, input_json, prediction, probability, decision, explanation or {}, client_id)

    # ==================== ADMIN METHODS ====================

    def get_admin_stats(self) -> Dict[str, Any]:
        """Get global platform statistics for admin dashboard."""
        with self.session() as s:
            from sqlalchemy import case, literal_column

            # Single query for all user-level stats
            user_stats = s.execute(
                select(
                    func.count(User.id).label("total_users"),
                    func.sum(case((User.subscription_status == "active", 1), else_=0)).label("active_subscriptions"),
                    func.sum(case((User.role == "admin", 1), else_=0)).label("admin_count"),
                    func.sum(case((User.role == "client", 1), else_=0)).label("client_count"),
                    func.sum(case((User.is_active == True, 1), else_=0)).label("active_count"),
                    func.sum(case((User.is_active == False, 1), else_=0)).label("inactive_count"),
                )
            ).one()

            total_users = user_stats.total_users or 0
            active_subscriptions = int(user_stats.active_subscriptions or 0)
            admin_count = int(user_stats.admin_count or 0)
            client_count = int(user_stats.client_count or 0)
            active_count = int(user_stats.active_count or 0)
            inactive_count = int(user_stats.inactive_count or 0)

            # Plan distribution in one query
            plan_dist = s.execute(
                select(User.plan_tier, func.count(User.id)).group_by(User.plan_tier)
            ).all()

            # Single query for all prediction-level stats
            week_ago = datetime.utcnow() - timedelta(days=7)
            pred_stats = s.execute(
                select(
                    func.count(Prediction.id).label("total_predictions"),
                    func.sum(case((Prediction.prediction == "high_risk", 1), else_=0)).label("high_risk_cases"),
                    func.sum(case((Prediction.created_at >= week_ago, 1), else_=0)).label("recent_predictions"),
                )
            ).one()

            total_predictions = pred_stats.total_predictions or 0
            high_risk_cases = int(pred_stats.high_risk_cases or 0)
            recent_predictions = int(pred_stats.recent_predictions or 0)

            # Total clients
            total_clients = s.execute(select(func.count(Client.id))).scalar_one() or 0

            # Monthly predictions
            dialect = s.bind.dialect.name
            month_expr = func.strftime('%Y-%m', Prediction.created_at) if dialect == "sqlite" else func.to_char(Prediction.created_at, 'YYYY-MM')
            monthly = s.execute(
                select(month_expr, func.count(Prediction.id)).group_by(month_expr).order_by(month_expr)
            ).all()

            return {
                "total_users": total_users,
                "total_clients": total_clients,
                "total_predictions": total_predictions,
                "active_subscriptions": active_subscriptions,
                "high_risk_cases": high_risk_cases,
                "plan_distribution": {r[0]: int(r[1]) for r in plan_dist},
                "role_distribution": {"admin": admin_count, "client": client_count},
                "active_distribution": {"active": active_count, "inactive": inactive_count},
                "recent_predictions_week": recent_predictions,
                "monthly_predictions": [{"month": r[0], "count": int(r[1])} for r in monthly],
            }

    def get_all_predictions(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all predictions across all users (admin only)."""
        with self.session() as s:
            rows = s.execute(
                select(Prediction).order_by(Prediction.created_at.desc()).limit(limit)
            ).scalars().all()
            result = []
            for p in rows:
                pred_dict = {
                    "id": p.id,
                    "user_id": p.user_id,
                    "client_id": p.client_id,
                    "prediction": p.prediction,
                    "probability": p.probability,
                    "decision": p.decision,
                    "created_at": p.created_at.isoformat(),
                }
                if p.user_id:
                    user = s.get(User, p.user_id)
                    if user:
                        pred_dict["user_email"] = user.email
                result.append(pred_dict)
            return result

    def toggle_user_active(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Toggle user active/inactive status."""
        with self.session() as s:
            user = s.get(User, user_id)
            if not user:
                return None
            user.is_active = not user.is_active
            s.commit()
            return {
                "id": user.id,
                "email": user.email,
                "is_active": user.is_active,
            }

    def get_system_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get system logs for admin dashboard."""
        with self.session() as s:
            rows = s.execute(
                select(Log).order_by(Log.created_at.desc()).limit(limit)
            ).scalars().all()
            return [
                {
                    "id": l.id,
                    "action": l.action,
                    "level": l.level,
                    "details": l.details,
                    "created_at": l.created_at.isoformat(),
                }
                for l in rows
            ]

    def get_user_predictions(self, user_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """Get predictions for a specific user (admin viewing client data)."""
        with self.session() as s:
            rows = s.execute(
                select(Prediction)
                .filter_by(user_id=user_id)
                .order_by(Prediction.created_at.desc())
                .limit(limit)
            ).scalars().all()
            return [
                {
                    "id": p.id,
                    "user_id": p.user_id,
                    "client_id": p.client_id,
                    "prediction": p.prediction,
                    "probability": p.probability,
                    "decision": p.decision,
                    "created_at": p.created_at.isoformat(),
                }
                for p in rows
            ]

    def get_user_analytics(self, user_id: int) -> Dict[str, Any]:
        """Get analytics for a specific user (client's own data)."""
        with self.session() as s:
            total = s.execute(
                select(func.count(Prediction.id)).filter_by(user_id=user_id)
            ).scalar_one() or 0
            avg = s.execute(
                select(func.avg(Prediction.probability)).filter_by(user_id=user_id)
            ).scalar_one() or 0.0
            dist = s.execute(
                select(Prediction.prediction, func.count(Prediction.id))
                .filter_by(user_id=user_id)
                .group_by(Prediction.prediction)
            ).all()
            dialect = s.bind.dialect.name
            month_expr = func.strftime('%Y-%m', Prediction.created_at) if dialect == "sqlite" else func.to_char(Prediction.created_at, 'YYYY-MM')
            monthly = s.execute(
                select(month_expr, func.count(Prediction.id))
                .filter_by(user_id=user_id)
                .group_by(month_expr)
                .order_by(month_expr)
            ).all()
            return {
                "total_predictions": int(total),
                "average_probability": float(avg),
                "risk_distribution": {r[0]: int(r[1]) for r in dist},
                "monthly_predictions": [{"month": r[0], "count": int(r[1])} for r in monthly],
            }

    def list_enterprise_users(self, parent_id: int) -> List[Dict[str, Any]]:
        with self.session() as s:
            rows = s.execute(
                select(User).filter_by(parent_id=parent_id).order_by(User.created_at.asc())
            ).scalars().all()
            return [{
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "created_at": u.created_at.isoformat()
            } for u in rows]

    def create_enterprise_user(self, email: str, password_hash: str, parent_id: int, first_name: str = None, last_name: str = None) -> Dict[str, Any]:
        return self.create_user(
            email=email,
            password_hash=password_hash,
            role="client_user",
            plan_tier="free",
            is_active=True,
            parent_id=parent_id,
            first_name=first_name,
            last_name=last_name
        )

    def update_enterprise_user(self, user_id: int, parent_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self.session() as s:
            u = s.get(User, user_id)
            if not u or u.parent_id != parent_id:
                return None
            if "first_name" in data: u.first_name = data["first_name"]
            if "last_name" in data: u.last_name = data["last_name"]
            if "is_active" in data: u.is_active = data["is_active"]
            s.flush()
            return {
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "created_at": u.created_at.isoformat()
            }

    def toggle_enterprise_user_active(self, user_id: int, parent_id: int) -> Optional[Dict[str, Any]]:
        with self.session() as s:
            u = s.get(User, user_id)
            if not u or u.parent_id != parent_id:
                return None
            u.is_active = not u.is_active
            s.commit()
            return {
                "id": u.id,
                "email": u.email,
                "is_active": u.is_active,
                "first_name": u.first_name,
                "last_name": u.last_name
            }

    def reset_enterprise_user_password(self, user_id: int, parent_id: int, new_password_hash: str) -> bool:
        with self.session() as s:
            u = s.get(User, user_id)
            if not u or u.parent_id != parent_id:
                return False
            u.password_hash = new_password_hash
            s.commit()
            return True

    def update_enterprise_profile(self, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self.session() as s:
            u = s.get(User, user_id)
            if not u:
                return None
            if "first_name" in data: u.first_name = data["first_name"]
            if "last_name" in data: u.last_name = data["last_name"]
            if "phone" in data: u.phone = data["phone"]
            if "wilaya" in data: u.wilaya = data["wilaya"]
            if "address" in data: u.address = data["address"]
            if "photo_url" in data: u.photo_url = data["photo_url"]
            if "company_name" in data: u.company_name = data["company_name"]
            if "company_sector" in data: u.company_sector = data["company_sector"]
            if "password_hash" in data: u.password_hash = data["password_hash"]
            s.flush()
            return {
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone": u.phone,
                "wilaya": u.wilaya,
                "address": u.address,
                "photo_url": u.photo_url,
                "company_name": u.company_name,
                "company_sector": u.company_sector
            }

    def get_all_enterprises(self) -> List[Dict[str, Any]]:
        """List all enterprise admin accounts (role='client') for superadmin console."""
        with self.session() as s:
            rows = s.execute(
                select(User).filter_by(role="client").order_by(User.created_at.desc())
            ).scalars().all()
            result = []
            for u in rows:
                client_count = s.execute(
                    select(func.count(Client.id)).filter_by(owner_id=u.id)
                ).scalar_one() or 0
                prediction_count = s.execute(
                    select(func.count(Prediction.id)).filter_by(user_id=u.id)
                ).scalar_one() or 0
                result.append({
                    "id": u.id,
                    "email": u.email,
                    "company_name": u.company_name,
                    "company_sector": u.company_sector,
                    "plan_tier": u.plan_tier,
                    "subscription_status": u.subscription_status,
                    "is_active": u.is_active,
                    "wilaya": u.wilaya,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "phone": u.phone,
                    "client_count": client_count,
                    "prediction_count": prediction_count,
                    "created_at": u.created_at.isoformat(),
                })
            return result

    def get_sector_stats(self) -> Dict[str, Any]:
        """Get statistics grouped by company sector for superadmin."""
        with self.session() as s:
            sector_rows = s.execute(
                select(User.company_sector, func.count(User.id))
                .filter(User.role == "client")
                .group_by(User.company_sector)
            ).all()
            sectors: Dict[str, int] = {}
            for sector, count in sector_rows:
                label = sector or "Non spécifié"
                sectors[label] = int(count)

            client_sector_rows = s.execute(
                select(User.company_sector, func.count(Client.id))
                .join(Client, Client.owner_id == User.id)
                .filter(User.role == "client")
                .group_by(User.company_sector)
            ).all()
            clients_by_sector: Dict[str, int] = {}
            for sector, count in client_sector_rows:
                label = sector or "Non spécifié"
                clients_by_sector[label] = int(count)

            return {
                "enterprises_by_sector": sectors,
                "clients_by_sector": clients_by_sector,
            }
    # ==================== CONTACT MESSAGE METHODS ====================

    # ==================== PAYMENT METHODS ====================

    def create_payment_record(self, user_id: int, amount: float, currency: str = "DZD",
                               payment_method: str = "", plan_id: str = "",
                               billing_period: str = "monthly", status: str = "completed") -> dict:
        """Create a payment record."""
        from models import Payment
        with self.session() as s:
            payment = Payment(
                user_id=user_id,
                amount=amount,
                currency=currency,
                payment_method=payment_method,
                plan_id=plan_id,
                billing_period=billing_period,
                status=status,
            )
            s.add(payment)
            s.flush()
            return {
                "id": payment.id,
                "amount": payment.amount,
                "currency": payment.currency,
                "payment_method": payment.payment_method,
                "plan_id": payment.plan_id,
                "billing_period": payment.billing_period,
                "status": payment.status,
                "created_at": payment.created_at.isoformat()
            }

    def get_user_payment_history(self, user_id: int) -> list:
        """Get payment history for a user."""
        from models import Payment
        with self.session() as s:
            payments = s.execute(
                select(Payment)
                .filter(Payment.user_id == user_id)
                .order_by(Payment.created_at.desc())
            ).scalars().all()
            return [{
                "id": p.id,
                "amount": p.amount,
                "currency": p.currency,
                "payment_method": p.payment_method,
                "plan_id": p.plan_id,
                "billing_period": p.billing_period,
                "status": p.status,
                "transaction_id": p.transaction_id,
                "created_at": p.created_at.isoformat()
            } for p in payments]

    def update_subscription_expiry(self, user_id: int, expires_at: str = None) -> bool:
        """Update subscription expiry for a user."""
        from models import User
        with self.session() as s:
            u = s.get(User, user_id)
            if not u:
                return False
            u.subscription_expires_at = expires_at
            if expires_at:
                u.subscription_status = "active"
            return True

    # ==================== CONTACT MESSAGE METHODS ====================

    def create_contact_message(self, name: str, email: str, subject: str, message: str, message_type: str = "contact") -> int:
        """Create a new contact message."""
        from models import ContactMessage
        s = self.SessionLocal()
        try:
            msg = ContactMessage(
                name=name,
                email=email,
                subject=subject,
                message=message,
                message_type=message_type,
                is_read=False
            )
            s.add(msg)
            s.commit()
            msg_id = msg.id
            return msg_id
        except Exception as e:
            s.rollback()
            logger.error(f"Failed to create contact message: {str(e)}")
            raise
        finally:
            s.close()

    def get_contact_messages(self, page: int = 1, per_page: int = 20, filters: Dict[str, Any] = None) -> tuple[List[Dict[str, Any]], int]:
        """Get paginated contact messages with filters."""
        from models import ContactMessage
        with self.session() as s:
            query = select(ContactMessage)
            
            # Apply filters
            if filters:
                if "is_read" in filters:
                    query = query.filter_by(is_read=filters["is_read"])
                if "message_type" in filters:
                    query = query.filter_by(message_type=filters["message_type"])
                if "email" in filters:
                    query = query.filter_by(email=filters["email"])
            
            # Count total
            count_query = select(func.count(ContactMessage.id))
            if filters:
                if "is_read" in filters:
                    count_query = count_query.filter(ContactMessage.is_read == filters["is_read"])
                if "message_type" in filters:
                    count_query = count_query.filter(ContactMessage.message_type == filters["message_type"])
                if "email" in filters:
                    count_query = count_query.filter(ContactMessage.email == filters["email"])
            total = s.execute(count_query).scalar_one() or 0
            
            # Order and paginate
            query = query.order_by(ContactMessage.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
            rows = s.execute(query).scalars().all()
            
            messages = [{
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "subject": m.subject,
                "message": m.message,
                "message_type": m.message_type,
                "is_read": m.is_read,
                "read_at": m.read_at.isoformat() if m.read_at else None,
                "response_message": m.response_message,
                "responded_at": m.responded_at.isoformat() if m.responded_at else None,
                "created_at": m.created_at.isoformat(),
                "updated_at": m.updated_at.isoformat()
            } for m in rows]
            
            return messages, total

    def get_contact_message_by_id(self, message_id: int) -> Optional[Dict[str, Any]]:
        """Get a contact message by ID."""
        from models import ContactMessage
        with self.session() as s:
            msg = s.get(ContactMessage, message_id)
            if not msg:
                return None
            return {
                "id": msg.id,
                "name": msg.name,
                "email": msg.email,
                "subject": msg.subject,
                "message": msg.message,
                "message_type": msg.message_type,
                "is_read": msg.is_read,
                "read_at": msg.read_at.isoformat() if msg.read_at else None,
                "response_message": msg.response_message,
                "responded_at": msg.responded_at.isoformat() if msg.responded_at else None,
                "responded_by_admin_id": msg.responded_by_admin_id,
                "created_at": msg.created_at.isoformat(),
                "updated_at": msg.updated_at.isoformat()
            }

    def mark_contact_message_as_read(self, message_id: int) -> bool:
        """Mark a contact message as read."""
        from models import ContactMessage
        with self.session() as s:
            msg = s.get(ContactMessage, message_id)
            if not msg:
                return False
            msg.is_read = True
            msg.read_at = datetime.utcnow()
            s.commit()
            return True

    def respond_to_contact_message(self, message_id: int, response_message: str, admin_id: int = None) -> bool:
        """Add a response to a contact message."""
        from models import ContactMessage
        with self.session() as s:
            msg = s.get(ContactMessage, message_id)
            if not msg:
                return False
            msg.response_message = response_message
            msg.responded_at = datetime.utcnow()
            msg.responded_by_admin_id = admin_id
            msg.is_read = True
            msg.read_at = datetime.utcnow()
            s.commit()
            return True

    def delete_contact_message(self, message_id: int) -> bool:
        """Delete a contact message."""
        from models import ContactMessage
        with self.session() as s:
            msg = s.get(ContactMessage, message_id)
            if not msg:
                return False
            s.delete(msg)
            s.commit()
            return True

    def get_contact_message_stats(self) -> Dict[str, Any]:
        """Get statistics about contact messages."""
        from models import ContactMessage
        with self.session() as s:
            total = s.execute(select(func.count(ContactMessage.id))).scalar_one() or 0
            unread = s.execute(
                select(func.count(ContactMessage.id)).filter(ContactMessage.is_read == False)
            ).scalar_one() or 0
            responded = s.execute(
                select(func.count(ContactMessage.id)).filter(ContactMessage.response_message.isnot(None))
            ).scalar_one() or 0
            
            by_type = s.execute(
                select(ContactMessage.message_type, func.count(ContactMessage.id))
                .group_by(ContactMessage.message_type)
            ).all()
            
            return {
                "total": total,
                "unread": unread,
                "responded": responded,
                "pending": total - responded,
                "total_messages": total,
                "unread_messages": unread,
                "responded_messages": responded,
                "pending_responses": total - responded,
                "by_type": {r[0]: int(r[1]) for r in by_type}
            }

