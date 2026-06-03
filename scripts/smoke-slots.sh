#!/usr/bin/env bash
# Smoke test for the availability engine. Dev server must be running.
# Usage: bash scripts/smoke-slots.sh [base-url]
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

# Pick a weekday date ~7 days out (avoids "past slot" filtering today).
FUTURE="$(date -d '+7 days' +%F 2>/dev/null || date -v+7d +%F)"
WD=$(( ( $(date -d "$FUTURE" +%u 2>/dev/null || date -jf %F "$FUTURE" +%u) + 6 ) % 7 ))

say "register independent barber -> 201"
show "$(req POST /api/auth/register \
  "{\"email\":\"slots+$TS@example.com\",\"password\":\"password123\",\"fullName\":\"Slots\",\"role\":\"barber\"}")"

say "create barber profile -> 201"
show "$(req POST /api/barbers "{\"displayName\":\"Slots $TS\"}")"
SLUG="$(slug_of)"; echo "barber slug: $SLUG"

say "set working hours: that weekday 10:00-13:00 (weekday=$WD) -> 200"
show "$(req PUT "/api/barbers/$SLUG/working-hours" \
  "{\"intervals\":[{\"weekday\":$WD,\"startMinute\":600,\"endMinute\":780}]}")"

say "add service (30 min) -> 201"
show "$(req POST /api/provider/services "{\"name\":\"Cut $TS\",\"durationMin\":30,\"priceAmd\":3000}")"
SVC="$(id_of)"; echo "service id: $SVC"

say "availability for $FUTURE (15-min slots 10:00..12:30 for a 30-min service) -> 200"
show "$(req GET "/api/barbers/$SLUG/availability?date=$FUTURE&serviceIds=$SVC")"

rm -f "$BODY" "$JAR"
echo
echo "Done. Expect the last response to list slot start times (ISO UTC) for $FUTURE."
