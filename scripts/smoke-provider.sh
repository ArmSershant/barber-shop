#!/usr/bin/env bash
# Smoke test for provider-profile endpoints. Dev server must be running.
# Usage: bash scripts/smoke-provider.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
BODY="$(mktemp)"
TS="$(date +%s)"

say() { printf '\n=== %s ===\n' "$1"; }
show() { echo "HTTP $1"; cat "$BODY"; echo; }
slug_of() { grep -o '"slug":"[^"]*"' "$BODY" | head -n1 | sed 's/.*:"//;s/"$//'; }

# Each role gets its own cookie jar.
OWNER_JAR="$(mktemp)"; BARBER_JAR="$(mktemp)"; CUST_JAR="$(mktemp)"

req() { # jar method path [json]
  local jar="$1" method="$2" path="$3" data="${4:-}"
  if [ -n "$data" ]; then
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" \
      -H 'Content-Type: application/json' -d "$data" -c "$jar" -b "$jar"
  else
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" -c "$jar" -b "$jar"
  fi
}

say "register shop_owner -> 201"
show "$(req "$OWNER_JAR" POST /api/auth/register \
  "{\"email\":\"owner+$TS@example.com\",\"password\":\"password123\",\"fullName\":\"Owner\",\"role\":\"shop_owner\"}")"

say "create shop -> 201"
show "$(req "$OWNER_JAR" POST /api/shops "{\"name\":\"Smoke Shop $TS\",\"address\":\"Kentron\"}")"
SHOP_SLUG="$(slug_of)"; echo "shop slug: $SHOP_SLUG"

say "GET /api/shops/$SHOP_SLUG (public) -> 200"
show "$(req "$OWNER_JAR" GET "/api/shops/$SHOP_SLUG")"

say "PATCH shop -> 200"
show "$(req "$OWNER_JAR" PATCH "/api/shops/$SHOP_SLUG" "{\"description\":\"Best fades in town\"}")"

say "create shop again (same owner) -> 409"
show "$(req "$OWNER_JAR" POST /api/shops "{\"name\":\"Second Shop\"}")"

say "add barber to shop -> 201"
show "$(req "$OWNER_JAR" POST "/api/shops/$SHOP_SLUG/barbers" "{\"displayName\":\"Aram $TS\",\"experienceYears\":5}")"

say "register customer -> 201"
show "$(req "$CUST_JAR" POST /api/auth/register \
  "{\"email\":\"cust+$TS@example.com\",\"password\":\"password123\",\"fullName\":\"Cust\",\"role\":\"customer\"}")"

say "customer tries to create shop -> 403"
show "$(req "$CUST_JAR" POST /api/shops "{\"name\":\"Nope\"}")"

say "register independent barber -> 201"
show "$(req "$BARBER_JAR" POST /api/auth/register \
  "{\"email\":\"barber+$TS@example.com\",\"password\":\"password123\",\"fullName\":\"Narek\",\"role\":\"barber\"}")"

say "barber creates own profile -> 201"
show "$(req "$BARBER_JAR" POST /api/barbers "{\"displayName\":\"Narek $TS\",\"experienceYears\":8}")"
BARBER_SLUG="$(slug_of)"; echo "barber slug: $BARBER_SLUG"

say "GET /api/barbers/$BARBER_SLUG (public) -> 200"
show "$(req "$BARBER_JAR" GET "/api/barbers/$BARBER_SLUG")"

rm -f "$BODY" "$OWNER_JAR" "$BARBER_JAR" "$CUST_JAR"
echo
echo "Done. Expected codes: 201, 201, 200, 200, 409, 201, 201, 403, 201, 201, 200."
