#!/bin/sh
set -e

# Inject runtime config so VITE_API_URL can be set per-deployment without rebuilding.
printf 'window.__RUNTIME_CONFIG__ = { "API_URL": "%s" };\n' "$RUNTIME_API_URL" \
      > /usr/share/nginx/html/config.js

exec "$@"
