FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

RUN mkdir -p /app/models /app/logs /app/data

EXPOSE 8000

# Use sync worker for lower memory footprint and increase timeout for ML model initialization
CMD ["sh", "-c", "gunicorn run:app -b 0.0.0.0:$PORT --workers 1 --worker-class sync --timeout 120 --graceful-timeout 30"]