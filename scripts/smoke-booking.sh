#!/usr/bin/env bash
# Smoke test for the booking flow. Dev server must be running.
# Usage: bash scripts/smoke-booking.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
BODY="$(mktemp)"
BARBER_JAR="$(mktemp)"
CUST_JAR="$(mktemp)"
TS="$(date +%s)"

say() { printf '\n=== %s ===\n' "$1"; }
show() { echo "HTTP $1"; cat "$BODY"; echo; }
slug_of() { grep -o '"slug":"[^"]*"' "$BODY" | head -n1 | sed 's/.*:"//;s/"$//'; }
id_of() { grep -o '"id":"[^"]*"' "$BODY" | head -n1 | sed 's/.*:"//;s/"$//'; }
first_slot() { grep -o '"slots":\["[^"]*"' "$BODY" | sed 's/.*\["//; s/"$//'; }

req() { # jar method path [json]
  local jar="$1" method="$2" path="$3" data="${4:-}"
  if [ -n "$data" ]; then
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" \
      -H 'Content-Type: application/json' -d "$data" -c "$jar" -b "$jar"
  else
    curl -s -o "$BODY" -w '%{http_code}' -X "$method" "$BASE$path" -c "$jar" -b "$jar"
  fi
}

FUTURE="$(date -d '+7 days' +%F 2>/dev/null || date -v+7d +%F)"
WD=$(( ( $(date -d "$FUTURE" +%u 2>/dev/null || date -jf %F "$FUTURE" +%u) + 6 ) % 7 ))

say "setup: register barber -> 201"
show "$(req "$BARBER_JAR" POST /api/auth/register \
  "{\"email\":\"bk-barber+$TS@example.com\",\"password\":\"password123\",\"fullName\":\"BK Barber\",\"role\":\"barber\"}")"

say "setup: create profile -> 201"
show "$(req "$BARBER_JAR" POST /api/barbers "{\"displayName\":\"BK $TS\"}")"
SLUG="$(slug_of)"

say "setup: working hours (weekday=$WD 10:00-13:00) -> 200"
show "$(req "$BARBER_JAR" PUT "/api/barbers/$SLUG/working-hours" \
  "{\"intervals\":[{\"weekday\":$WD,\"startMinute\":600,\"endMinute\":780}]}")"

say "setup: add service (30 min) -> 201"
show "$(req "$BARBER_JAR" POST /api/provider/services "{\"name\":\"Cut $TS\",\"durationMin\":30,\"priceAmd\":3000}")"
SVC="$(id_of)"

say "get availability $FUTURE -> 200 (pick first slot)"
show "$(req "$CUST_JAR" GET "/api/barbers/$SLUG/availability?date=$FUTURE&serviceIds=$SVC")"
SLOT="$(first_slot)"; echo "first slot: $SLOT"

say "register customer -> 201"
show "$(req "$CUST_JAR" POST /api/auth/register \
  "{\"email\":\"bk-cust+$TS@example.com\",\"password\":\"password123\",\"fullName\":\"BK Cust\",\"role\":\"customer\"}")"

say "book the slot (customer) -> 201"
show "$(req "$CUST_JAR" POST "/api/barbers/$SLUG/bookings" "{\"serviceIds\":[\"$SVC\"],\"startsAt\":\"$SLOT\"}")"
BOOKING="$(id_of)"; echo "booking id: $BOOKING"

say "book the SAME slot again -> expect 409 (SLOT_UNAVAILABLE; SLOT_TAKEN under a race)"
show "$(req "$CUST_JAR" POST "/api/barbers/$SLUG/bookings" "{\"serviceIds\":[\"$SVC\"],\"startsAt\":\"$SLOT\"}")"

say "cancel the booking (customer) -> 200"
show "$(req "$CUST_JAR" POST "/api/bookings/$BOOKING/cancel" "{\"reason\":\"changed plans\"}")"

say "guest books the now-free slot (no login) -> 201"
GUEST_JAR="$(mktemp)"
show "$(req "$GUEST_JAR" POST "/api/barbers/$SLUG/bookings" \
  "{\"serviceIds\":[\"$SVC\"],\"startsAt\":\"$SLOT\",\"guest\":{\"name\":\"Walk In\",\"phone\":\"+37491000000\"}}")"

rm -f "$BODY" "$BARBER_JAR" "$CUST_JAR" "$GUEST_JAR"
echo
echo "Done. Expect: …201s, a 409 on the duplicate slot, 200 cancel, 201 guest rebook."
