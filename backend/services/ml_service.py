import json
import pickle
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
        self._initialized = False
        # Try loading if files exist, but don't fail
        self.load_artifacts()

    def load_artifacts(self) -> None:
        """Load existing model artifacts if they exist."""
        if MODEL_ARTIFACT_PATH.exists():
            try:
                self.model = joblib.load(MODEL_ARTIFACT_PATH)
                self._initialized = True
            except Exception as e:
                print(f"[WARNING] Failed to load model: {e}")
                self.model = None
        
        if SCALER_ARTIFACT_PATH.exists():
            try:
                self.scaler = joblib.load(SCALER_ARTIFACT_PATH)
                self._initialized = True
            except Exception as e:
                print(f"[WARNING] Failed to load scaler: {e}")
                self.scaler = None
        
        if FEATURES_PATH.exists():
            try:
                with open(FEATURES_PATH, "r", encoding="utf-8") as fh:
                    self.features = json.load(fh)
            except Exception as e:
                print(f"[WARNING] Failed to load features: {e}")
                self.features = []

    def _initialize_models(self) -> None:
        """Lazily initialize models on first use."""
        if self._initialized:
            return
        
        print("[INFO] Initializing ML models on first prediction request...")
        try:
            models_dir = MODEL_ARTIFACT_PATH.parent
            models_dir.mkdir(parents=True, exist_ok=True)
            
            features = [
                "loan_amnt", "annual_inc", "dti", "fico_range_high", "revol_util",
                "open_acc", "total_acc", "inq_last_6mths", "delinq_2yrs", "acc_now_delinq"
            ]
            
            # Generate synthetic training data
            np.random.seed(42)
            X = np.random.randn(150, len(features)) * 50
            X[:, 0] = np.abs(X[:, 0]) * 1000 + 10000
            X[:, 1] = np.abs(X[:, 1]) * 10000 + 50000
            X[:, 2] = np.abs(X[:, 2]) * 10 + 10
            X[:, 3] = np.abs(X[:, 3]) * 100 + 500
            X[:, 4] = np.abs(X[:, 4]) * 20
            X[:, 5] = np.round(np.abs(X[:, 5])) % 20 + 1
            X[:, 6] = np.round(np.abs(X[:, 6])) % 40 + 2
            X[:, 7] = np.round(np.abs(X[:, 7])) % 10
            X[:, 8] = np.round(np.abs(X[:, 8])) % 5
            X[:, 9] = np.round(np.abs(X[:, 9])) % 3
            
            y = np.where((X[:, 1] < 60000) | (X[:, 2] > 35) | (X[:, 3] < 650), 1, 0)
            
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            model = XGBClassifier(n_estimators=30, max_depth=4, random_state=42, eval_metric='logloss', verbosity=0)
            model.fit(X_scaled, y, verbose=False)
            
            with open(MODEL_ARTIFACT_PATH, "wb") as f:
                pickle.dump(model, f)
            with open(SCALER_ARTIFACT_PATH, "wb") as f:
                pickle.dump(scaler, f)
            with open(FEATURES_PATH, "w") as f:
                json.dump(features, f)
            
            self.model = model
            self.scaler = scaler
            self.features = features
            self._initialized = True
            print("[OK] ML models initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize models: {e}")
            raise

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Lazily initialize models on first prediction request
        if not self._initialized:
            self._initialize_models()
        
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
