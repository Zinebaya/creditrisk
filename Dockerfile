FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy entire project
COPY . .

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci --prefer-offline --no-audit

# Build Next.js as standalone
RUN npm run build

# ============================================

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000
ENV NODE_ENV=production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

# Install Node.js in Python image for running Next.js
RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy built Next.js standalone from builder stage
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/.next/standalone
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/standalone/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/.next/standalone/public
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/

# Install production dependencies for frontend
WORKDIR /app/frontend
RUN npm ci --only=production --prefer-offline --no-audit || true

RUN mkdir -p /app/models /app/logs /app/data

WORKDIR /app

EXPOSE 8000

# Start script that runs Flask with reverse proxy for Next.js
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

CMD ["/app/docker-start.sh"]