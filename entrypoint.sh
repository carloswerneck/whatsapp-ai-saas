#!/bin/sh
set -e
echo "Running database migrations..."
node ./node_modules/prisma/node_modules/.bin/prisma db push --skip-generate || echo "Migration failed, continuing..."
echo "Starting server..."
exec node server.js