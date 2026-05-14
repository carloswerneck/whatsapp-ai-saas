#!/bin/sh
set -e
echo "Running database migrations..."
prisma db push --skip-generate || echo "Migration failed, continuing..."
echo "Starting server..."
exec node server.js