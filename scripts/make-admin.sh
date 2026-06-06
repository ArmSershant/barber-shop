#!/usr/bin/env bash
# Grant the admin role to an existing user by email.
# Usage: pnpm make:admin user@example.com   (or: bash scripts/make-admin.sh <email>)
set -euo pipefail

EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then
  echo "Usage: pnpm make:admin <email>"
  exit 1
fi

SQL="INSERT INTO \"user_roles\" (\"user_id\", \"role\")
     SELECT id, 'admin' FROM \"users\" WHERE email = '${EMAIL}'
     ON CONFLICT (\"user_id\", \"role\") DO NOTHING;"

echo "$SQL" | pnpm prisma db execute --stdin --schema prisma/schema.prisma
echo "Granted admin to ${EMAIL} (if the user exists)."
