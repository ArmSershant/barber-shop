#!/usr/bin/env bash
# Smoke test for the auth flow. Requires the dev server running (pnpm dev).
# Usage: bash scripts/smoke-auth.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
JAR="$(mktemp)"
BODY="$(mktemp)"
EMAIL="smoke+$(date +%s)@example.com"
PASS="password123"

say() { printf '\n=== %s ===\n' "$1"; }

req() { # method path [json-data]
  local method="$1" path="$2" data="${3:-}"
  if [ -n "$data" ]; then
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" \
      -H 'Content-Type: application/json' -d "$data" -c "$JAR" -b "$JAR"
  else
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" -c "$JAR" -b "$JAR"
  fi
}

show() { echo "HTTP $1"; cat "$BODY"; echo; }

say "register ($EMAIL)  -> expect 201"
show "$(req POST /api/auth/register \
  "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"fullName\":\"Smoke Test\",\"role\":\"customer\"}")"

say "GET /api/me  -> expect 200 with the user"
show "$(req GET /api/me)"

say "GET /api/provider/ping as customer  -> expect 403"
show "$(req GET /api/provider/ping)"

say "POST /api/auth/refresh  -> expect 200 (rotates the refresh cookie)"
show "$(req POST /api/auth/refresh)"

say "GET /api/me after refresh  -> expect 200"
show "$(req GET /api/me)"

say "POST /api/auth/logout  -> expect 200"
show "$(req POST /api/auth/logout)"

say "GET /api/me after logout  -> expect 401"
show "$(req GET /api/me)"

rm -f "$JAR" "$BODY"
echo
echo "Done. Eyeball the codes above against the expectations."
