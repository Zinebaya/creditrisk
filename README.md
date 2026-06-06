# Fintech Credit Risk Platform

Enterprise-grade credit risk prediction platform built with Flask, XGBoost, Supabase, Redis, and Docker.

## Features

- XGBoost credit risk model trained using LendingClub dataset
- Strict feature schema validation
- Redis caching for repeated predictions
- Supabase PostgreSQL integration for users and prediction history
- JWT authentication with role-based access control
- Docker-ready backend with Gunicorn
- Batch prediction via CSV upload

## Quick Start

1. Copy `.env.example` to `.env` and set values.
2. Place your LendingClub dataset at `./data/lending_club.csv`.
3. For local development, create and activate a Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
python -m pip install -r requirements.txt
```

4. Build and run with Docker:

```bash
docker compose up --build
```

5. Initialize the database schema for local Postgres or Supabase:

```bash
psql "$SUPABASE_DB_URL" -f sql/schema.sql
```

5. Train the model locally:

```bash
python ml/train.py
```

6. Start the backend:

```bash
docker compose up --build
```

7. Access the frontend UI:

Open `http://localhost:8000/` in your browser.

8. Use the API directly:

- `POST /auth/register`
- `POST /auth/login`
- `POST /predict`
- `POST /batch_predict`
- `GET /features`
- `GET /health`
- `GET /logs`

## Architecture

- `ml/`: training and feature selection pipeline
- `api/`: Flask application and endpoints
- `models/`: persisted artifacts
- `services/`: caching, database, auth, validation
- `config/`: environment and application configuration
- `utils/`: schema and logging helpers
