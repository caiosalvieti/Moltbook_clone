#!/bin/bash

set -e

cd "$(dirname "$0")"

# Setup
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "Created .env from .env.example — add your Anthropic API key before running."
    exit 1
  fi
fi

pip install -r requirements.txt -q

# Run
python main.py "$@"

# Open frontend
open frontend/index.html 2>/dev/null || echo "Open frontend/index.html in your browser."
