import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd

from config.config import settings


class ModelManager:
    def __init__(self, model_path: str, scaler_path: str, features_path: str):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.features_path = features_path
        self.model = None
        self.scaler = None
        self.selected_features = []
        self._load_artifacts()

    def _load_artifacts(self):
        if Path(self.model_path).exists():
            self.model = joblib.load(self.model_path)
        if Path(self.scaler_path).exists():
            self.scaler = joblib.load(self.scaler_path)
        if Path(self.features_path).exists():
            with open(self.features_path, "r", encoding="utf-8") as fp:
                self.selected_features = json.load(fp)
        if not self.model or not self.scaler or not self.selected_features:
            raise FileNotFoundError("Model artifacts not found. Run ml/train.py first.")

    def _transform(self, df: pd.DataFrame) -> np.ndarray:
        data = df[self.selected_features].astype(float)
        return self.scaler.transform(data)

    def cache_key(self, payload: Dict[str, Any]) -> str:
        ordered = {k: payload[k] for k in sorted(payload.keys())}
        digest = hashlib.sha256(json.dumps(ordered, sort_keys=True).encode("utf-8")).hexdigest()
        return f"prediction:{digest}"

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = pd.DataFrame([payload], columns=self.selected_features).astype(float)
        features = self._transform(data)
        proba = self.model.predict_proba(features)[0][1]
        label = self.model.predict(features)[0]
        risk = "HIGH" if label == 1 else "LOW"
        prediction = "high_risk" if risk == "HIGH" else "low_risk"
        decision = "decline" if prediction == "high_risk" else "approve"
        return {
            "risk": risk,
            "prediction": prediction,
            "probability": float(round(proba, 4)),
            "decision": decision,
            "selected_features": self.selected_features,
        }

    def batch_predict(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        clean = df[self.selected_features].astype(float)
        features = self.scaler.transform(clean)
        probabilities = self.model.predict_proba(features)[:, 1]
        labels = self.model.predict(features)
        results = []
        for label, proba in zip(labels, probabilities):
            risk = "HIGH" if int(label) == 1 else "LOW"
            prediction = "high_risk" if risk == "HIGH" else "low_risk"
            decision = "decline" if prediction == "high_risk" else "approve"
            results.append({"risk": risk, "prediction": prediction, "probability": float(round(proba, 4)), "decision": decision})
        return results
