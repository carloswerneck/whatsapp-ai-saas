#!/bin/sh
set -e
echo "Starting server..."
NODE_OPTIONS="--dns-result-order=ipv4first" exec npx next start