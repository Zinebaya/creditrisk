# Credit Risk Prediction Backend

This backend is a production-ready Flask API for an AI credit risk SaaS platform.

## Features

- JWT authentication with admin registration
- XGBoost prediction and batch CSV/XLSX scoring
- Redis caching for repeated prediction requests
- PostgreSQL persistence with SQLAlchemy
- SHAP explainability for individual predictions
- Request validation, rate limiting, and CORS
- Enterprise logging to files and database

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Docker

Use the root `docker-compose.yml` service or the backend Dockerfile in `backend/Dockerfile`.

## API Endpoints

### Authentication

- `POST /auth/register` - Register new admin user
- `POST /auth/login` - Login and get JWT token

### Predictions

- `POST /api/predict` - Single credit risk prediction (requires JWT)
- `POST /api/batch_predict` - Batch predictions (requires JWT)

### Data

- `GET /api/features` - Get required feature names (requires JWT)
- `GET /api/history` - Get user's prediction history (requires JWT)

### Analytics

- `GET /api/analytics` - Get system analytics (requires JWT)
- `GET /api/health` - Health check (no auth required)

## Training

Train the model from the Lending Club dataset:

```bash
cd backend
python -m ml.train
```

This saves:

- `models/xgboost_model.pkl`
- `models/scaler.pkl`
- `models/selected_features.json`
