#!/usr/bin/env bash
# Copies the schema plus ONLY the restaurants, their menus and their owner logins from the local Docker database
# to a hosted PostgreSQL (e.g. Supabase). Customers, orders, payments, reviews, riders and admins are NOT copied.
#
# The password is read from the environment and is never written to disk or printed:
#   export TARGET_PASSWORD='...'            (use your hosted database password)
#   export TARGET_HOST=aws-0-ap-south-1.pooler.supabase.com
#   export TARGET_USER=postgres.<project-ref>
#   backend/scripts/transfer-restaurants.sh
# Optional: TARGET_PORT (default 5432), TARGET_DB (default postgres), LOCAL_CONTAINER (default backend-db-1),
#           TARGET_SSLMODE (default require).
# Requires Docker. The target database must be EMPTY (no tables in the public schema).
set -euo pipefail

: "${TARGET_PASSWORD:?set TARGET_PASSWORD}"
: "${TARGET_HOST:?set TARGET_HOST}"
: "${TARGET_USER:?set TARGET_USER}"
TARGET_PORT="${TARGET_PORT:-5432}"
TARGET_DB="${TARGET_DB:-postgres}"
TARGET_SSLMODE="${TARGET_SSLMODE:-require}"
LOCAL_CONTAINER="${LOCAL_CONTAINER:-backend-db-1}"
PG_IMAGE="postgres:16"

local_psql() { docker exec -i "$LOCAL_CONTAINER" sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "${POSTGRES_DB:-$POSTGRES_USER}" "$@"' sh "$@"; }
remote_psql(){ docker run --rm -i -e PGPASSWORD="$TARGET_PASSWORD" -e PGSSLMODE="$TARGET_SSLMODE" "$PG_IMAGE" psql -v ON_ERROR_STOP=1 -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" "$@"; }

echo "Checking the target is reachable and empty..."
tables=$(remote_psql -tAc "select count(*) from information_schema.tables where table_schema='public'")
if [ "$tables" != "0" ]; then echo "Target already has $tables tables in public. Refusing to continue." >&2; exit 1; fi

echo "1/3 Schema (and Flyway history, so the app will not re-run migrations)..."
docker exec "$LOCAL_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "${POSTGRES_DB:-$POSTGRES_USER}" --no-owner --no-privileges --schema-only' | remote_psql -q >/dev/null
docker exec "$LOCAL_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "${POSTGRES_DB:-$POSTGRES_USER}" --no-owner --no-privileges --data-only --table=flyway_schema_history' | remote_psql -q >/dev/null

echo "2/3 Owner logins, restaurants and menus..."
copy() { # copy <table> <select query>
  local_psql -qc "\\copy ($2) to stdout" | remote_psql -qc "\\copy $1 from stdin"
}
OWNERS="select id from users where id in (select owner_id from restaurants where owner_id is not null)"
copy users               "select * from users where id in ($OWNERS) order by id"
copy restaurants         "select * from restaurants order by id"
copy products            "select * from products where restaurant_id is not null order by id"
copy product_variants    "select * from product_variants where product_id in (select id from products where restaurant_id is not null) order by id"
copy product_addons      "select * from product_addons where product_id in (select id from products where restaurant_id is not null) order by id"

echo "3/3 Resetting id counters..."
for t in users restaurants products product_variants product_addons; do
  remote_psql -qc "select setval(pg_get_serial_sequence('public.$t','id'), coalesce((select max(id) from public.$t), 1), (select count(*) > 0 from public.$t))" >/dev/null
done

echo "Done. Copied:"
remote_psql -tAc "select 'users '||(select count(*) from users)||', restaurants '||(select count(*) from restaurants)||', products '||(select count(*) from products)||', variants '||(select count(*) from product_variants)||', addons '||(select count(*) from product_addons)"
