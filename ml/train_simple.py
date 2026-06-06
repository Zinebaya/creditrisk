import os
import json
import argparse
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib

def load_data(path: str) -> pd.DataFrame:
    if not Path(path).exists():
        raise FileNotFoundError(f"Dataset not found at {path}")
    # Sample a subset to avoid memory issues
    sample_size = 50000
    df = pd.read_csv(path, low_memory=False, nrows=sample_size)
    return df

def build_target(df: pd.DataFrame) -> pd.Series:
    if "loan_status" in df.columns:
        bad_states = [
            "Charged Off",
            "Late (31-120 days)",
            "Late (16-30 days)",
            "Default",
            "Does not meet the credit policy. Status:Charged Off",
        ]
        return df["loan_status"].isin(bad_states).astype(int)
    if "bad_loan" in df.columns:
        return df["bad_loan"].astype(int)
    raise ValueError("Unable to locate a binary target column. Provide loan_status or bad_loan.")

def train_model(X_train, y_train):
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    return {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1_score": f1_score(y_test, y_pred),
        "auc": roc_auc_score(y_test, y_pred_proba)
    }

def save_artifacts(model, scaler, features, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    joblib.dump(model, os.path.join(output_dir, "model.pkl"))
    joblib.dump(scaler, os.path.join(output_dir, "scaler.pkl"))

    with open(os.path.join(output_dir, "features.json"), "w") as f:
        json.dump(features, f)

def run_training(data_path: str, output_dir: str) -> dict:
    df = load_data(data_path)
    y = build_target(df)

    # Use key features that are likely to exist
    key_features = [
        "loan_amnt", "annual_inc", "dti", "fico_range_high", "revol_util",
        "open_acc", "total_acc", "inq_last_6mths", "delinq_2yrs", "acc_now_delinq"
    ]

    # Filter to features that actually exist
    feature_cols = [col for col in key_features if col in df.columns]

    if not feature_cols:
        # Fallback: use any numeric columns
        feature_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [col for col in feature_cols if col not in ["id", "member_id"]]

    if not feature_cols:
        raise ValueError("No suitable features found in dataset")

    X = df[feature_cols].fillna(df[feature_cols].median())

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    model = train_model(X_train, y_train)

    metrics = evaluate_model(model, X_test, y_test)
    save_artifacts(model, scaler, feature_cols, output_dir)

    print("Training complete")
    print(json.dumps(metrics, indent=2))
    return metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train XGBoost credit risk model.")
    parser.add_argument("--data-path", default=os.getenv("DATA_PATH", "./lending_club.csv"))
    parser.add_argument("--output-dir", default=os.getenv("MODEL_DIR", "./models"))
    args = parser.parse_args()
    run_training(args.data_path, args.output_dir)