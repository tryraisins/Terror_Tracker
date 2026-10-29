#!/usr/bin/env bash
# Emails once per UTC day when the latest scan reports a search lane is down
# (Brave quota exhausted, Google News or DeepSeek Search failing for half the
# states, or DeepSeek rejecting the key or balance).
# Lives at /srv/terror-tracker/search-lane-alert.sh and is called by run-scan.sh
# after each scan.
#
# This is a notification, not a failure: it never arms the retry timer (a retry
# cannot refill a quota) and never changes the scan's exit status. A clean scan
# clears the daily stamp, so a lane that breaks again is reported again.
set -uo pipefail

ENV_FILE="${SCAN_ENV_FILE:-/etc/terror-tracker/scan.env}"
REPORTS="${SCAN_REPORTS_DIR:-/var/log/terror-tracker/reports}"
LATEST="$REPORTS/latest.json"
STAMP="$REPORTS/.search-lane-alert"
RESEND_URL="${RESEND_URL:-https://api.resend.com/emails}"

# Same reason as scan-alert.sh: the env file is data, not shell.
read_env() {
  [ -r "$ENV_FILE" ] || return 0
  grep -m1 "^$1=" "$ENV_FILE" 2>/dev/null | cut -d= -f2-
}

[ -f "$LATEST" ] || { echo "no report; nothing to check"; exit 0; }

# A scan that died before writing leaves an older run's report behind. Do not
# alert on someone else's run; scan-alert.sh already covers the failure.
AGE=$(( $(date +%s) - $(stat -c %Y "$LATEST") ))
if [ "$AGE" -ge 1800 ]; then
  echo "latest report is $(( AGE / 60 )) min old; skipping"
  exit 0
fi

ALERTS=$(jq -r '(.searchLaneAlerts // []) | join("; ")' "$LATEST")
if [ -z "$ALERTS" ]; then
  rm -f "$STAMP"
  echo "search lanes healthy"
  exit 0
fi

TODAY=$(date -u +%F)
if [ "$(cat "$STAMP" 2>/dev/null)" = "$TODAY" ]; then
  echo "search lane alert already sent today: $ALERTS"
  exit 0
fi

RESEND_API_KEY="${RESEND_API_KEY:-$(read_env RESEND_API_KEY)}"
ALERT_EMAIL_TO="${ALERT_EMAIL_TO:-$(read_env ALERT_EMAIL_TO)}"
ALERT_FROM_EMAIL="${ALERT_EMAIL_FROM:-$(read_env ALERT_EMAIL_FROM)}"
ALERT_FROM_EMAIL="${ALERT_FROM_EMAIL:-alerts@tryraisins.dev}"
FROM="Terror Tracker <$ALERT_FROM_EMAIL>"
SITE="${NEXT_PUBLIC_APP_URL:-$(read_env NEXT_PUBLIC_APP_URL)}"
SITE="${SITE:-https://terrortracker.tryraisins.dev}"

: "${RESEND_API_KEY:?RESEND_API_KEY is missing from $ENV_FILE}"
: "${ALERT_EMAIL_TO:?ALERT_EMAIL_TO is missing from $ENV_FILE}"

RUN_ID=$(jq -r '.runId // "unknown"' "$LATEST")
STATUS=$(jq -r '.coverageStatus // "unknown"' "$LATEST")
DISCOVERED=$(jq -r '.report.urlsDiscovered // 0' "$LATEST")
SEARCH_FAIL=$(jq -r '(.report.searchFailures // []) | length' "$LATEST")

BODY=$(printf '%s\n' \
  "The latest incident scan ran with a search lane down:" \
  "" \
  "  $ALERTS" \
  "" \
  "Scans keep running on the lanes that still work, so coverage shrinks quietly." \
  "Brave: top up or wait for the monthly reset. Google News: check the" \
  "'googlenews' search failures in the archived report; NEWS_DISCOVERY_ENABLE_GOOGLE_NEWS=false disables it." \
  "DeepSeek Search: top up the DeepSeek balance or check the key; NEWS_DISCOVERY_ENABLE_DEEPSEEK_SEARCH=false disables it." \
  "" \
  "Run: $RUN_ID" \
  "Coverage status: $STATUS" \
  "URLs discovered: $DISCOVERED (search failures $SEARCH_FAIL)" \
  "Time: $(date -u '+%Y-%m-%d %H:%M UTC')" \
  "" \
  "This is the only message sent today for this condition. It is sent again after a clean scan." \
  "" \
  "$SITE")

PAYLOAD=$(jq -n \
  --arg from "$FROM" \
  --arg to "$ALERT_EMAIL_TO" \
  --arg subject "[Terror Tracker] Search degraded: $ALERTS" \
  --arg text "$BODY" \
  '{from: $from, to: [$to], subject: $subject, text: $text}')

RESPONSE=$(curl -sS --max-time 20 -w '\n%{http_code}' \
  -X POST "$RESEND_URL" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary "$PAYLOAD")

CODE=$(printf '%s' "$RESPONSE" | tail -n1)
if [ "$CODE" != "200" ]; then
  # No stamp is written, so the next scan tries again.
  echo "SEARCH LANE ALERT DELIVERY FAILED: resend rejected the message with HTTP $CODE" >&2
  printf '%s\n' "$RESPONSE" >&2
  exit 1
fi

printf '%s\n' "$TODAY" > "$STAMP"
echo "search lane alert emailed: $ALERTS"
