#!/bin/bash

# Update CoachArtie Docker Submodules
# This script updates all git submodules to their latest commits on main/master

set -e

echo "🔄 Updating CoachArtie Docker submodules..."

# Update all submodules to latest remote commits
echo "📦 Updating coachartie_capabilities submodule..."
git submodule update --remote coachartie_capabilities

# Show what changed
echo "📋 Submodule update summary:"
git submodule status

echo "✅ Submodules updated successfully!"
echo "💡 Run 'docker-compose up -d --build' to deploy the changes"