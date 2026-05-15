#!/bin/sh
set -e

echo "=== WA Agent Startup ==="

echo "Running database migrations..."
npx prisma db push --skip-generate 2>&1 || {
  echo "WARNING: prisma db push failed. The app will still start."
  echo "If this is the first deploy, make sure:"
  echo "  1. DATABASE_URL is correct and the database is reachable"
  echo "  2. The pgvector extension is installed (CREATE EXTENSION IF NOT EXISTS vector;)"
}

echo "Starting server..."
exec npx next start