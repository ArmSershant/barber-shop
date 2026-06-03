#!/usr/bin/env bash
# Seed fixed test accounts (customer, barber, shop_owner) via the signup API.
# Reads credentials from .env. Idempotent: existing accounts report "exists".
# Dev server must be running. Usage: bash scripts/seed-test-accounts.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
ENV_FILE=".env"

getenv() { grep -E "^$1=" "$ENV_FILE" | head -1 | sed -E 's/^[^=]+=//; s/^"//; s/"$//'; }

PASS="$(getenv TEST_PASSWORD)"
CUSTOMER="$(getenv TEST_CUSTOMER_EMAIL)"
BARBER="$(getenv TEST_BARBER_EMAIL)"
OWNER="$(getenv TEST_SHOP_OWNER_EMAIL)"

register() { # email role fullName
  local email="$1" role="$2" name="$3"
  local code
  code=$(curl -s -o /tmp/seedbody -w '%{http_code}' -X POST "$BASE/api/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$PASS\",\"fullName\":\"$name\",\"role\":\"$role\"}")
  if [ "$code" = "201" ]; then
    echo "  created  $role  <$email>"
  elif [ "$code" = "409" ]; then
    echo "  exists   $role  <$email>"
  else
    echo "  FAILED ($code) $role <$email>: $(cat /tmp/seedbody)"
  fi
}

echo "Seeding test accounts at $BASE ..."
register "$CUSTOMER" customer   "Test Customer"
register "$BARBER"   barber     "Test Barber"
register "$OWNER"    shop_owner "Test Owner"
rm -f /tmp/seedbody

cat <<EOF

Done. Login with any of these (password is the same for all):

  Customer    $CUSTOMER
  Barber      $BARBER
  Shop owner  $OWNER
  Password    $PASS
EOF
