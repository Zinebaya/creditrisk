#!/usr/bin/env python
"""Generate ML model artifacts for Credit Risk Prediction"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from ml.train import train_model

if __name__ == "__main__":
    try:
        metrics = train_model()
        print("✅ ML model artifacts generated successfully!")
        print(f"Metrics: {metrics}")
    except Exception as e:
        print(f"❌ Error generating model: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
