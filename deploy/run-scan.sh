#!/usr/bin/env bash
# Runs one scheduled scan in the scan container.
# Lives at /srv/terror-tracker/run-scan.sh on the host.
#
#   run-scan.sh            daily slot (168h window)
#   run-scan.sh --weekly   Sunday catch-up (336h window, matching the workflow)
set -uo pipefail

BASE=/srv/terror-tracker
REPORTS=/var/log/terror-tracker/reports
LOCK=/run/terror-scan.lock
CONTAINER=terror-scan-slot

WINDOW_ARGS=()
if [ "${1:-}" = "--weekly" ]; then
  WINDOW_ARGS=(
    -e INCIDENT_LOOKBACK_HOURS=336
    -e SEARCH_PUBLICATION_MAX_AGE_HOURS=336
    -e SEARCH_FRESHNESS=month
  )
fi

cd "$BASE"

# The scan container runs as uid 1000 (the image's `node` user) and writes here.
mkdir -p "$REPORTS"
chown 1000:1000 "$REPORTS" 2>/dev/null || true
# Adjudication artifacts land beside the reports and need the same ownership.
mkdir -p /var/log/terror-tracker/adjudications
chown 1000:1000 /var/log/terror-tracker/adjudications 2>/dev/null || true

# Concurrency guard. Exits non-zero rather than silently skipping: a skipped slot
# means the previous run is still going, which is a failure worth an alert.
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "another scan already holds $LOCK; this slot is being skipped" >&2
  exit 75
fi

# systemd's TimeoutStartSec kills this script and releases the lock, but the
# container belongs to dockerd and keeps running. A named container plus this
# removal means the next slot can never run alongside a wedged one.
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

STAMP=$(date -u +%Y%m%dT%H%M%SZ)

docker compose --env-file .env.deploy --profile scan run --rm --no-deps \
  --name "$CONTAINER" "${WINDOW_ARGS[@]}" scan
STATUS=$?

# Keep a per-run copy: scan_runs stores counts but not the per-URL failure list,
# so the JSON report is the only forensic trail for a bad run.
if [ -f "$REPORTS/latest.json" ]; then
  cp "$REPORTS/latest.json" "$REPORTS/scan-$STAMP.json"
fi
find "$REPORTS" -name 'scan-*.json' -type f -mtime +30 -delete 2>/dev/null || true

echo "scan finished with status $STATUS"

# Tell the operator once a day if a search lane is down. A notification only:
# it must not change the scan's exit status or arm a retry.
"$BASE/search-lane-alert.sh" || echo "search lane alert check failed (see above)" >&2

# Adjudication is paused. Two independent reviews found that the pass could close
# a stored-pair review by comparing the record with itself, and that dismissing a
# distinct candidate loses an unrecorded event. It stays out of the scan until
# both are fixed and re-reviewed; run it by hand meanwhile:
#   docker compose --env-file .env.deploy --profile scan run --rm --no-deps \
#     scan npx tsx scripts/adjudicate-duplicate-reviews.ts --limit 10

exit "$STATUS"
