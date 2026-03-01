#!/bin/sh
set -e

# Inject runtime config so VITE_API_URL can be set per-deployment without rebuilding.
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = { "API_URL": "${VITE_API_URL:-}" };
EOF

exec "$@"
