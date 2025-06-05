#!/bin/bash

# Quick health check script for all services
# Usage: ./test-quick.sh

echo "🏥 Quick Health Check for CoachArtie Services"
echo "============================================="

services=(
  "Capabilities:9991"
  "Brain:9992" 
  "SMS:9993"
  "Email:9994"
)

all_healthy=true

for service in "${services[@]}"; do
  name=$(echo $service | cut -d: -f1)
  port=$(echo $service | cut -d: -f2)
  
  if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "✅ $name (port $port) - healthy"
  else
    echo "❌ $name (port $port) - unhealthy"
    all_healthy=false
  fi
done

echo

if $all_healthy; then
  echo "🎉 All services are healthy!"
  exit 0
else
  echo "💥 Some services are unhealthy"
  exit 1
fi