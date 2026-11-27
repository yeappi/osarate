#!/usr/bin/env bash
# ローカルの使い捨て Postgres で migrations と DB テストを実行する
# 必要：PostgreSQL 15以上のサーバー（initdb / pg_ctl）と psql
# 使い方：bash scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN="${PGBIN:-$(dirname "$(command -v initdb 2>/dev/null || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
DIR="$(mktemp -d)"; PORT="${PORT:-54329}"
trap '"$PGBIN/pg_ctl" -D "$DIR/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
"$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$DIR/data" -o "-k $DIR -p $PORT" -l "$DIR/log" start >/dev/null
sleep 1
P="psql -h $DIR -p $PORT -U postgres -q -v ON_ERROR_STOP=1"
$P -f supabase/tests/_supabase_stub.sql
for f in supabase/migrations/*.sql; do $P -f "$f"; done
for f in supabase/tests/*_test.sql; do echo "== $f"; $P -f "$f"; done
echo "DB tests OK"
