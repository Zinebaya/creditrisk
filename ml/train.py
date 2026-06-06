import argparse
import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_selection import SelectKBest, VarianceThreshold, mutual_info_classif
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
import xgboost as xgb

LEAKAGE_COLUMNS = [
    "id",
    "member_id",
    "emp_title",
    "title",
    "zip_code",
    "addr_state",
    "issue_d",
    "earliest_cr_line",
    "last_pymnt_d",
    "last_credit_pull_d",
    "next_pymnt_d",
    "policy_code",
    "pymnt_plan",
    "url",
    "sub_grade",
]

CATEGORICAL_LIMIT = 12


def load_data(path: str) -> pd.DataFrame:
    if not Path(path).exists():
        raise FileNotFoundError(f"Dataset not found at {path}")

    # Sample a subset of the data to avoid memory issues
    sample_size = 50000  # Use 50k samples for training
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
            "In Grace Period",
        ]
        return df["loan_status"].isin(bad_states).astype(int)
    if "bad_loan" in df.columns:
        return df["bad_loan"].astype(int)
    raise ValueError("Unable to locate a binary target column. Provide loan_status or bad_loan.")


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    if "annual_inc" in df.columns and "loan_amnt" in df.columns:
        df["debt_to_income_ratio"] = df["loan_amnt"] / (df["annual_inc"].replace(0, np.nan) / 12)
    if "revol_bal" in df.columns and "revol_util" in df.columns:
        df["credit_utilization"] = df["revol_bal"] * (df["revol_util"].replace("%", "", regex=False).astype(float) / 100.0)
    if "emp_length" in df.columns and "annual_inc" in df.columns:
        df["income_stability_index"] = df["emp_length"].fillna(0).replace({"< 1 year": 0, "1 year": 1, "2 years": 2, "3 years": 3, "4 years": 4, "5 years": 5, "6 years": 6, "7 years": 7, "8 years": 8, "9 years": 9, "10+ years": 10}).astype(float)
    return df


def clean_data(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str]]:
    # Remove leakage columns if they exist
    df = df.drop(columns=[c for c in LEAKAGE_COLUMNS if c in df.columns], errors="ignore")

    # Ensure essential columns exist
    essential_cols = ["loan_amnt", "annual_inc"]
    existing_essential = [c for c in essential_cols if c in df.columns]
    if existing_essential:
        df = df.dropna(subset=existing_essential, how="any")

    if "loan_status" in df.columns:
        df = df.dropna(subset=["loan_status"], how="any")

    # Get numeric and categorical columns
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = [c for c in df.select_dtypes(include=["object"]).columns if c not in ["loan_status"]]
    low_cardinality = [c for c in categorical_cols if df[c].nunique() <= CATEGORICAL_LIMIT]

    # Clean numeric columns
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    if numeric_cols:
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

    # Clean categorical columns
    for col in low_cardinality:
        df[col] = df[col].fillna("missing")

    # One-hot encode
    if low_cardinality:
        df = pd.get_dummies(df, columns=low_cardinality, dummy_na=False, drop_first=True)

    return df, numeric_cols, low_cardinality


def build_pipeline(numeric_features, categorical_features):
    transformers = []
    if numeric_features:
        transformers.append(("scale", StandardScaler(), numeric_features))

    if categorical_features:
        transformers.append(
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                categorical_features,
            )
        )

    if not transformers:
        return Pipeline([("pass", StandardScaler())])

    return ColumnTransformer(transformers=transformers, remainder="passthrough")


def select_features(X, y, columns):
    selector = VarianceThreshold(threshold=0.01)
    X_reduced = selector.fit_transform(X)
    retained = [col for keep, col in zip(selector.get_support(), columns) if keep]
    k = min(40, len(retained))
    if k <= 0:
        raise ValueError("No features remain after variance thresholding.")

    best = SelectKBest(mutual_info_classif, k=k)
    best.fit(X_reduced, y)
    selected = [retained[i] for i in np.where(best.get_support())[0]]
    return selected


def train_model(X_train, y_train):
    params = {
        "max_depth": [4, 6],
        "learning_rate": [0.05, 0.1],
        "n_estimators": [100, 150],
        "subsample": [0.8, 1.0],
        "colsample_bytree": [0.7, 0.9],
    }
    estimator = xgb.XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=42)
    grid = GridSearchCV(estimator, params, cv=3, scoring="roc_auc", n_jobs=-1, verbose=1)
    grid.fit(X_train, y_train)
    return grid.best_estimator_


def evaluate_model(model, X, y):
    predictions = model.predict(X)
    proba = model.predict_proba(X)[:, 1]
    return {
        "accuracy": float(round(accuracy_score(y, predictions), 4)),
        "precision": float(round(precision_score(y, predictions), 4)),
        "recall": float(round(recall_score(y, predictions), 4)),
        "f1_score": float(round(f1_score(y, predictions), 4)),
        "roc_auc": float(round(roc_auc_score(y, proba), 4)),
    }


def save_artifacts(model, scaler, selected_features, output_dir="./models"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    joblib.dump(model, Path(output_dir) / "xgboost_model.pkl")
    joblib.dump(scaler, Path(output_dir) / "scaler.pkl")
    with open(Path(output_dir) / "selected_features.json", "w", encoding="utf-8") as fp:
        json.dump(selected_features, fp, indent=2)


def run_training(data_path: str, output_dir: str):
    df = load_data(data_path)
    df = feature_engineering(df)
    y = build_target(df)
    df, numeric_cols, categorical_cols = clean_data(df)

    features = [c for c in df.columns if c != "loan_status" and c != "bad_loan"]
    X = df[features]

    transformer = build_pipeline(numeric_cols, categorical_cols)
    X_transformed = transformer.fit_transform(X)
    selected_features = select_features(X_transformed, y, features)

    if not selected_features:
        raise ValueError("No selected features after feature selection.")

    X_selected = X[selected_features]
    scaler = StandardScaler().fit(X_selected)
    X_scaled = scaler.transform(X_selected)

    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    model = train_model(X_train, y_train)

    metrics = evaluate_model(model, X_test, y_test)
    save_artifacts(model, scaler, selected_features, output_dir)

    print("Training complete")
    print(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train XGBoost credit risk model.")
    parser.add_argument("--data-path", default=os.getenv("DATA_PATH", "./lending_club.csv"))
    parser.add_argument("--output-dir", default=os.getenv("MODEL_DIR", "./models"))
    args = parser.parse_args()
    run_training(args.data_path, args.output_dir)
