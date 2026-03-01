#!/bin/sh
set -e

# Replace the API URL placeholder baked in at build time with the runtime value.
# RUNTIME_API_URL is set via docker-compose environment from the VITE_API_URL stack variable.
if [ -n "$RUNTIME_API_URL" ]; then
  find /usr/share/nginx/html/assets -name "*.js" \
    -exec sed -i "s|PITBOOK_API_URL_PLACEHOLDER|$RUNTIME_API_URL|g" {} \;
fi

exec "$@"
