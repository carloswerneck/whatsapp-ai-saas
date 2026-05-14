#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma db push --skip-generate || echo "Migration failed, continuing..."
echo "Starting server..."
exec npx next start