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

WINDOW_ARGS=()
if [ "${1:-}" = "--weekly" ]; then
  WINDOW_ARGS=(
    -e INCIDENT_LOOKBACK_HOURS=336
    -e SEARCH_PUBLICATION_MAX_AGE_HOURS=336
    -e SEARCH_FRESHNESS=month
  )
fi

cd "$BASE"
mkdir -p "$REPORTS"

# Concurrency guard. Replaces the workflow's `concurrency:` group, but unlike the
# workflow a skipped slot is logged rather than silently queued.
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "another scan already holds $LOCK; skipping this slot"
  exit 0
fi

STAMP=$(date -u +%Y%m%dT%H%M%SZ)

docker compose --env-file .env.deploy --profile scan run --rm --no-deps \
  "${WINDOW_ARGS[@]}" scan
STATUS=$?

# Keep a per-run copy: scan_runs stores counts but not the per-URL failure list,
# so the JSON report is the only forensic trail for a bad run.
if [ -f "$REPORTS/latest.json" ]; then
  cp "$REPORTS/latest.json" "$REPORTS/scan-$STAMP.json"
fi
find "$REPORTS" -name 'scan-*.json' -type f -mtime +30 -delete 2>/dev/null || true

echo "scan finished with status $STATUS"
exit "$STATUS"
