FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and frontend code strategically
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY run.py /app/
COPY docker-start.sh /app/

# Install Node.js in Python image for running Next.js
RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Build frontend — install ALL deps (including devDeps like tailwindcss/postcss),
# run the build, then prune to production-only deps
WORKDIR /app/frontend
RUN npm ci --prefer-offline --no-audit && \
    npm run build && \
    npm ci --omit=dev --prefer-offline --no-audit

ENV NODE_ENV=production

RUN mkdir -p /app/models /app/logs /app/data

WORKDIR /app

RUN chmod +x /app/docker-start.sh

EXPOSE 8000

CMD ["/app/docker-start.sh"]