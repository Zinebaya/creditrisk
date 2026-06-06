import csv
import io
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd


def validate_prediction_input(payload: Dict[str, any], selected_features: List[str]) -> Optional[str]:
    missing = [f for f in selected_features if f not in payload]
    if missing:
        return f"Missing features: {missing}"

    try:
        for key in selected_features:
            float(payload[key])
    except Exception:
        return "Invalid feature types; all selected features must be numeric"

    return None


def _read_csv(csv_bytes: bytes) -> pd.DataFrame:
    decoded = csv_bytes.decode("utf-8", errors="replace")
    data = io.StringIO(decoded)
    return pd.read_csv(data, skipinitialspace=True)


def _read_excel(excel_bytes: bytes) -> pd.DataFrame:
    data = io.BytesIO(excel_bytes)
    return pd.read_excel(data)


def validate_batch_file(filename: str, file_bytes: bytes, selected_features: List[str]) -> Dict[str, any]:
    extension = Path(filename).suffix.lower()
    try:
        if extension in {".xls", ".xlsx"}:
            df = _read_excel(file_bytes)
        else:
            df = _read_csv(file_bytes)
    except Exception:
        return {"error": "Unable to parse upload. Provide a valid CSV or Excel file."}

    if df.columns is None or len(df.columns) == 0:
        return {"error": "Uploaded file does not contain a header row."}

    df.columns = [str(h).strip() for h in df.columns]
    column_map = {}
    for feature in selected_features:
        matched = next((col for col in df.columns if col.lower() == feature.lower()), None)
        if matched is None:
            return {"error": f"Invalid schema. Missing required column: {feature}."}
        column_map[matched] = feature

    df = df.rename(columns=column_map)

    try:
        df = df.astype({feature: float for feature in selected_features})
    except Exception:
        return {"error": "All required model columns must be numeric."}

    return {"error": None, "dataframe": df}
