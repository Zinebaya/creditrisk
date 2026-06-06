import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler

try:
    import shap
    _SHAP_AVAILABLE = True
except Exception as e:
    print(f"Warning: Failed to import shap: {e}")
    _SHAP_AVAILABLE = False

from config.config import settings

MODEL_ARTIFACT_PATH = Path(settings.MODEL_PATH)
SCALER_ARTIFACT_PATH = Path(settings.SCALER_PATH)
FEATURES_PATH = Path(settings.FEATURES_PATH)

class MLModelService:
    def __init__(self):
        self.model: Optional[XGBClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        self.features: List[str] = []
        self.load_artifacts()

    def load_artifacts(self) -> None:
        if MODEL_ARTIFACT_PATH.exists():
            self.model = joblib.load(MODEL_ARTIFACT_PATH)
        if SCALER_ARTIFACT_PATH.exists():
            self.scaler = joblib.load(SCALER_ARTIFACT_PATH)
        if FEATURES_PATH.exists():
            with open(FEATURES_PATH, "r", encoding="utf-8") as fh:
                self.features = json.load(fh)

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None or self.scaler is None:
            raise RuntimeError("Model or scaler artifact not loaded")

        feature_vector = [payload.get(feature, 0) for feature in self.features]
        scaled_vector = self.scaler.transform([feature_vector])
        predictions = self.model.predict_proba(scaled_vector)[0]
        probability = float(predictions[1]) if len(predictions) > 1 else float(predictions[0])
        classification = "high_risk" if probability >= 0.5 else "low_risk"

        explanation = self.explain(scaled_vector)

        return {
            "prediction": classification,
            "probability": probability,
            "decision": "decline" if classification == "high_risk" else "approve",
            "explanation": explanation,
        }

    def explain(self, scaled_feature_matrix: np.ndarray) -> Dict[str, Any]:
        if self.model is None or not _SHAP_AVAILABLE:
            return {"shap_values": [], "base_values": [], "feature_names": self.features}

        try:
            explainer = shap.Explainer(self.model)
            shap_values = explainer(scaled_feature_matrix)
            return {
                "shap_values": shap_values.values.tolist(),
                "base_values": shap_values.base_values.tolist() if hasattr(shap_values, "base_values") else [],
                "feature_names": self.features,
            }
        except Exception as e:
            print(f"Failed to generate SHAP explanation: {e}")
            return {"shap_values": [], "base_values": [], "feature_names": self.features}

    @staticmethod
    def normalize_payload(payload: Dict[str, Any], features: List[str]) -> Dict[str, Any]:
        return {k: float(payload.get(k, 0)) for k in features}
