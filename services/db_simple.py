"""Simple database service without SQLAlchemy ORM"""

import sqlite3
import json
import os
from datetime import datetime


class DatabaseService:
    def __init__(self, db_path: str = "credit_risk.db"):

        # Fix sqlite URL if passed accidentally
        if isinstance(db_path, str) and db_path.startswith("sqlite:///"):
            db_path = db_path.replace("sqlite:///", "")

        BASE_DIR = os.getcwd()
        self.db_path = os.path.join(BASE_DIR, db_path)

        # Ensure DB file exists
        if not os.path.exists(self.db_path):
            open(self.db_path, "w").close()

        self._ensure_database()

    # =========================
    # DB INIT
    # =========================
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_database(self):
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                input_data TEXT,
                risk_level TEXT,
                probability REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                metric_type TEXT,
                metric_value REAL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        conn.commit()
        conn.close()

    # =========================
    # USERS
    # =========================
    def create_user(self, email: str, password_hash: str):
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (email, password_hash)
            )
            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()

    def get_user_by_email(self, email: str):
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    # =========================
    # DEFAULT ADMIN (FIXED)
    # =========================
    def ensure_default_admin(self, email: str, password_hash: str):
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()

            if not user:
                cursor.execute(
                    "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                    (email, password_hash)
                )
                conn.commit()
        finally:
            conn.close()

    # =========================
    # PREDICTIONS
    # =========================
    def store_prediction(self, user_id: int, input_data: dict, risk_level: str, probability: float):
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO predictions (user_id, input_data, risk_level, probability)
                VALUES (?, ?, ?, ?)
            """, (user_id, json.dumps(input_data), risk_level, probability))

            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()

    def get_user_predictions(self, user_id: int, limit: int = 10):
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                SELECT * FROM predictions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, limit))

            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    # =========================
    # ANALYTICS
    # =========================
    def get_analytics(self, user_id: int):
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "SELECT COUNT(*) as total FROM predictions WHERE user_id = ?",
                (user_id,)
            )
            total = dict(cursor.fetchone())["total"]

            cursor.execute("""
                SELECT risk_level, COUNT(*) as count
                FROM predictions
                WHERE user_id = ?
                GROUP BY risk_level
            """, (user_id,))

            risk_dist = {row["risk_level"]: row["count"] for row in cursor.fetchall()}

            cursor.execute("""
                SELECT AVG(probability) as avg_risk
                FROM predictions
                WHERE user_id = ?
            """, (user_id,))

            avg_risk = dict(cursor.fetchone())["avg_risk"] or 0.0

            return {
                "total_predictions": total,
                "high_risk_count": risk_dist.get("HIGH", 0),
                "medium_risk_count": risk_dist.get("MEDIUM", 0),
                "low_risk_count": risk_dist.get("LOW", 0),
                "avg_risk_score": avg_risk
            }

        finally:
            conn.close()

    # =========================
    # HEALTH CHECK
    # =========================
    def health_check(self):
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            conn.close()
            return True
        except:
            return False