#!/usr/bin/env bash
# Emails the operator when a scan run fails, and arms one retry.
# Invoked by terror-scan-alert.service (with retry) and
# terror-scan-alert-final.service (without, so a repeated failure cannot loop).
set -uo pipefail

ARM_RETRY=1
if [ "${1:-}" = "--no-retry" ]; then
  ARM_RETRY=0
fi

ENV_FILE=/etc/terror-tracker/scan.env
REPORTS=/var/log/terror-tracker/reports
LATEST="$REPORTS/latest.json"

# The env file is data, not shell. Sourcing it would choke on a value containing
# spaces or angle brackets ("Terror Tracker <alerts@...>") and would evaluate
# anything a future value happens to contain, so the few keys needed here are
# read literally instead.
read_env() {
  [ -r "$ENV_FILE" ] || return 0
  grep -m1 "^$1=" "$ENV_FILE" 2>/dev/null | cut -d= -f2-
}

RESEND_API_KEY="${RESEND_API_KEY:-$(read_env RESEND_API_KEY)}"
ALERT_EMAIL_TO="${ALERT_EMAIL_TO:-$(read_env ALERT_EMAIL_TO)}"
ALERT_FROM_EMAIL="${ALERT_EMAIL_FROM:-$(read_env ALERT_EMAIL_FROM)}"
ALERT_FROM_EMAIL="${ALERT_FROM_EMAIL:-alerts@tryraisins.dev}"
FROM="Terror Tracker <$ALERT_FROM_EMAIL>"
SITE="${NEXT_PUBLIC_APP_URL:-$(read_env NEXT_PUBLIC_APP_URL)}"
SITE="${SITE:-https://terrortracker.tryraisins.dev}"

: "${RESEND_API_KEY:?RESEND_API_KEY is missing from $ENV_FILE}"
: "${ALERT_EMAIL_TO:?ALERT_EMAIL_TO is missing from $ENV_FILE}"

# A failed run can die before writing a report (Mongo unreachable, image broken).
# In that case the newest file on disk belongs to an earlier run, so report the
# absence rather than quoting a stale status.
STATUS="no report written for this run"
DETAIL="The scan process exited non-zero before writing a report. The cause is in the unit log: journalctl -u terror-scan.service -n 100"
SUMMARY="scan failed with no report"

if [ -f "$LATEST" ]; then
  AGE=$(( $(date +%s) - $(stat -c %Y "$LATEST") ))
  if [ "$AGE" -lt 1800 ]; then
    STATUS=$(jq -r '.coverageStatus // "unknown"' "$LATEST")
    RUN_ID=$(jq -r '.runId // "unknown"' "$LATEST")
    FINISHED=$(jq -r '.runFinishedAt // "unknown"' "$LATEST")
    FETCHED=$(jq -r '.report.urlsFetched // 0' "$LATEST")
    FETCH_FAIL=$(jq -r '(.report.fetchFailures // []) | length' "$LATEST")
    SEARCH_FAIL=$(jq -r '(.report.searchFailures // []) | length' "$LATEST")
    FEED_FAIL=$(jq -r '(.report.feedFailures // []) | length' "$LATEST")
    BUDGET=$(jq -r '.fetchFailureBudget // "unknown"' "$LATEST")
    STATES=$(jq -r '(.statesScanned // []) | length' "$LATEST")

    SUMMARY="scan $STATUS"
    DETAIL=$(printf '%s\n' \
      "Coverage status: $STATUS" \
      "Run: $RUN_ID" \
      "Finished: $FINISHED" \
      "States scanned: $STATES" \
      "URLs fetched: $FETCHED (fetch failures $FETCH_FAIL, budget $BUDGET)" \
      "Search failures: $SEARCH_FAIL" \
      "Feed failures: $FEED_FAIL" \
      "" \
      "Report: $LATEST" \
      "Per-URL errors and the duplicate check are in the archived copy under $REPORTS.")
  else
    SUMMARY="scan exited non-zero, report is stale ($(( AGE / 60 )) min old)"
    STATUS="stale report"
  fi
fi

NOW_UTC=$(date -u '+%Y-%m-%d %H:%M UTC')
BODY=$(printf '%s\n' \
  "The scheduled incident scan failed on $(hostname -f 2>/dev/null || hostname)." \
  "" \
  "$DETAIL" \
  "" \
  "Time: $NOW_UTC" \
  "Retry: $([ "$ARM_RETRY" = "1" ] && echo "armed for 20 minutes from now" || echo "not armed (this was already the retry)")" \
  "" \
  "$SITE")

PAYLOAD=$(jq -n \
  --arg from "$FROM" \
  --arg to "$ALERT_EMAIL_TO" \
  --arg subject "[Terror Tracker] $SUMMARY" \
  --arg text "$BODY" \
  '{from: $from, to: [$to], subject: $subject, text: $text}')

RESPONSE=$(curl -sS --max-time 20 -w '\n%{http_code}' \
  -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary "$PAYLOAD")

CODE=$(printf '%s' "$RESPONSE" | tail -n1)
if [ "$CODE" != "200" ]; then
  echo "resend rejected the message: HTTP $CODE" >&2
  printf '%s\n' "$RESPONSE" >&2
  exit 1
fi

echo "alert emailed: $SUMMARY"

if [ "$ARM_RETRY" = "1" ]; then
  systemctl start terror-scan-retry.timer
  echo "retry timer armed"
fi
