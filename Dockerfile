FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy entire project
COPY . .

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci --prefer-offline --no-audit

# Build Next.js
RUN npm run build

# ============================================

FROM node:20-alpine AS node-runner

# Copy built frontend and node_modules
COPY --from=frontend-builder /app/frontend /app/frontend
WORKDIR /app/frontend

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit

# ============================================

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

# Copy built Next.js and node_modules from runner stage
COPY --from=node-runner /app/frontend/.next /app/frontend/.next
COPY --from=node-runner /app/frontend/public /app/frontend/public
COPY --from=node-runner /app/frontend/node_modules /app/frontend/node_modules
COPY --from=node-runner /app/frontend/package*.json /app/frontend/

# Install Node.js in Python image for running Next.js
RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/models /app/logs /app/data

EXPOSE 8000

# Start script that runs Flask with reverse proxy for Next.js
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

CMD ["/app/docker-start.sh"]