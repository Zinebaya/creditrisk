#!/usr/bin/env python
"""Initialize ML models for Credit Risk Prediction"""
import json
import pickle
from pathlib import Path
import numpy as np
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# Create models directory
models_dir = Path(__file__).parent / "models"
models_dir.mkdir(exist_ok=True)

# Define features to match frontend
features = [
    "loan_amnt", "annual_inc", "dti", "fico_range_high", "revol_util",
    "open_acc", "total_acc", "inq_last_6mths", "delinq_2yrs", "acc_now_delinq"
]

print(f"Initializing ML models in {models_dir}...")

# Create synthetic training data
np.random.seed(42)
n_samples = 200
X_train = np.random.rand(n_samples, len(features))
# Scale features to realistic ranges
X_train[:, 0] *= 50000  # loan_amnt: 0-50k
X_train[:, 1] *= 500000  # annual_inc: 0-500k
X_train[:, 2] = X_train[:, 2] * 50  # dti: 0-50
X_train[:, 3] = X_train[:, 3] * 850 + 300  # fico: 300-850
X_train[:, 4] *= 100  # revol_util: 0-100
X_train[:, 5] = np.round(X_train[:, 5] * 30)  # open_acc: 0-30
X_train[:, 6] = np.round(X_train[:, 6] * 60)  # total_acc: 0-60
X_train[:, 7] = np.round(X_train[:, 7] * 30)  # inq_6m: 0-30
X_train[:, 8] = np.round(X_train[:, 8] * 20)  # delinq_2y: 0-20
X_train[:, 9] = np.round(X_train[:, 9] * 10)  # acc_delinq: 0-10

# Create target with correlation to features (for realistic model)
y_train = np.where(
    (X_train[:, 1] < 60000) |  # low income
    (X_train[:, 2] > 40) |  # high DTI
    (X_train[:, 3] < 600) |  # low FICO
    (X_train[:, 8] > 2),  # delinquencies
    1, 0  # high_risk
)

# Train scaler
print("Training scaler...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# Train XGBoost model
print("Training XGBoost model...")
model = XGBClassifier(
    n_estimators=50,
    max_depth=4,
    random_state=42,
    verbosity=0,
    eval_metric='logloss'
)
model.fit(X_train_scaled, y_train, verbose=0)

# Save model
model_path = models_dir / "model.pkl"
with open(model_path, "wb") as f:
    pickle.dump(model, f)
print(f"✅ Model saved to {model_path}")

# Save scaler
scaler_path = models_dir / "scaler.pkl"
with open(scaler_path, "wb") as f:
    pickle.dump(scaler, f)
print(f"✅ Scaler saved to {scaler_path}")

# Save features
features_path = models_dir / "features.json"
with open(features_path, "w") as f:
    json.dump(features, f, indent=2)
print(f"✅ Features saved to {features_path}")

# Test the model
test_input = {feat: 1.0 for feat in features}
test_vector = np.array([test_input[f] for f in features]).reshape(1, -1)
test_scaled = scaler.transform(test_vector)
pred_proba = model.predict_proba(test_scaled)[0]
print(f"\n✅ Test prediction: probability={pred_proba[1]:.2%}, risk={'HIGH' if pred_proba[1] > 0.5 else 'LOW'}")
print("\n✨ ML models initialized successfully!")
