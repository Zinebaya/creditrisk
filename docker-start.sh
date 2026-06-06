#!/bin/bash
set -e

# Export PORT (default to 8000 if not set)
export PORT=${PORT:-8000}
export NEXT_PORT=3000
export NODE_ENV=production

echo "[INFO] Starting services..."

# Start Next.js server on port 3000 in background
echo "[INFO] Starting Next.js server on port $NEXT_PORT..."
cd /app/frontend

# Run Next.js with next start (standard mode) - bind only to localhost to prevent Render auto-detecting port 3000
npx next start -H 127.0.0.1 -p $NEXT_PORT > /tmp/nextjs.log 2>&1 &
NEXT_PID=$!

echo "[INFO] Next.js PID: $NEXT_PID"

# Give Next.js time to start
echo "[INFO] Waiting for Next.js server to be ready..."
sleep 8

# Check if Next.js started successfully
if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "[ERROR] Next.js failed to start!"
    cat /tmp/nextjs.log
    exit 1
fi

echo "[INFO] Next.js started successfully"

# Start Flask/Gunicorn on the exposed PORT
echo "[INFO] Starting Flask on port $PORT..."
cd /app
exec gunicorn run:app \
  -b 0.0.0.0:$PORT \
  --workers 1 \
  --worker-class sync \
  --timeout 120 \
  --graceful-timeout 30 \
  --access-logfile - \
  --error-logfile -
