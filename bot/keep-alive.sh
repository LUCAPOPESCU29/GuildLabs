#!/bin/bash
echo "🤖 Forge Bot keep-alive started"
while true; do
  echo "[$(date)] Starting bot..."
  node src/index.js
  echo "[$(date)] Bot crashed or stopped. Restarting in 5 seconds..."
  sleep 5
done
