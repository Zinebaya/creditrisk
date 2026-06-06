"""
Create ML model pickle files for Credit Risk Prediction
This file contains embedded model data that can be loaded without training
"""

import json
import sys
from pathlib import Path

def create_dummy_model_files():
    """Create dummy ML model files with embedded binary data"""
    import base64
    import pickle
    import numpy as np
    
    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        from sklearn.preprocessing import StandardScaler
        from xgboost import XGBClassifier
        
        features = [
            "loan_amnt", "annual_inc", "dti", "fico_range_high", "revol_util",
            "open_acc", "total_acc", "inq_last_6mths", "delinq_2yrs", "acc_now_delinq"
        ]
        
        # Generate synthetic training data
        np.random.seed(42)
        X = np.random.randn(100, len(features)) * 100
        y = np.random.randint(0, 2, 100)
        
        # Train scaler
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train model
        model = XGBClassifier(n_estimators=10, max_depth=3, random_state=42, eval_metric='logloss')
        model.fit(X_scaled, y, verbose=0)
        
        # Save files
        with open(models_dir / "scaler.pkl", "wb") as f:
            pickle.dump(scaler, f)
        
        with open(models_dir / "model.pkl", "wb") as f:
            pickle.dump(model, f)
        
        with open(models_dir / "features.json", "w") as f:
            json.dump(features, f)
        
        print(f"✅ Model files created in {models_dir}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = create_dummy_model_files()
    sys.exit(0 if success else 1)
