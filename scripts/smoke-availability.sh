#!/usr/bin/env bash
# Smoke test for time-off + breaks (independent barber, auto-approved).
# Dev server must be running. Usage: bash scripts/smoke-availability.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
BODY="$(mktemp)"
JAR="$(mktemp)"
TS="$(date +%s)"

say() { printf '\n=== %s ===\n' "$1"; }
show() { echo "HTTP $1"; cat "$BODY"; echo; }
slug_of() { grep -o '"slug":"[^"]*"' "$BODY" | head -n1 | sed 's/.*:"//;s/"$//'; }
id_of() { grep -o '"id":"[^"]*"' "$BODY" | head -n1 | sed 's/.*:"//;s/"$//'; }

req() { # method path [json]
  local method="$1" path="$2" data="${3:-}"
  if [ -n "$data" ]; then
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" \
      -H 'Content-Type: application/json' -d "$data" -c "$JAR" -b "$JAR"
  else
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" -c "$JAR" -b "$JAR"
  fi
}

say "register independent barber -> 201"
show "$(req POST /api/auth/register \
  "{\"email\":\"avail+$TS@example.com\",\"password\":\"password123\",\"fullName\":\"Avail\",\"role\":\"barber\"}")"

say "create barber profile -> 201"
show "$(req POST /api/barbers "{\"displayName\":\"Avail $TS\"}")"
SLUG="$(slug_of)"; echo "barber slug: $SLUG"

say "add time off (auto-approved) -> 201"
show "$(req POST "/api/barbers/$SLUG/time-off" \
  "{\"startsAt\":\"2026-07-01T00:00:00\",\"endsAt\":\"2026-07-03T23:59:59\",\"reason\":\"Vacation\"}")"
TO_ID="$(id_of)"; echo "time-off id: $TO_ID"

say "list time off -> 200 (should show status approved)"
show "$(req GET "/api/barbers/$SLUG/time-off")"

say "delete time off -> 200"
show "$(req DELETE "/api/barbers/$SLUG/time-off/$TO_ID")"

say "add daily break 14:00-15:00 (weekday null = every day) -> 201"
show "$(req POST "/api/barbers/$SLUG/breaks" "{\"weekday\":null,\"startMinute\":840,\"endMinute\":900}")"
BR_ID="$(id_of)"; echo "break id: $BR_ID"

say "list breaks -> 200"
show "$(req GET "/api/barbers/$SLUG/breaks")"

say "delete break -> 200"
show "$(req DELETE "/api/barbers/$SLUG/breaks/$BR_ID")"

rm -f "$BODY" "$JAR"
echo
echo "Done. Expected: 201, 201, 201, 200, 200, 201, 200, 200."
