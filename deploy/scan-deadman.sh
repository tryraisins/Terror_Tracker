#!/usr/bin/env bash
# Dead-man check: emails when no scan report has been written for 18 hours.
# This catches what email-on-failure cannot: the timer never firing at all
# (host rebooted, timer disabled, image pull wedged).
set -uo pipefail

ENV_FILE=/etc/terror-tracker/scan.env
REPORTS=/var/log/terror-tracker/reports
LATEST="$REPORTS/latest.json"

# Same reason as scan-alert.sh: the env file is data, not shell.
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
THRESHOLD_HOURS="$(read_env SCAN_HEALTH_STALE_HOURS)"
THRESHOLD_HOURS="${THRESHOLD_HOURS:-18}"

: "${RESEND_API_KEY:?RESEND_API_KEY is missing from $ENV_FILE}"
: "${ALERT_EMAIL_TO:?ALERT_EMAIL_TO is missing from $ENV_FILE}"

AGE_TEXT="no report has ever been written"
STALE=1
if [ -f "$LATEST" ]; then
  AGE=$(( $(date +%s) - $(stat -c %Y "$LATEST") ))
  AGE_TEXT="$(( AGE / 3600 )) hours old"
  if [ "$AGE" -lt $(( THRESHOLD_HOURS * 3600 )) ]; then
    echo "latest report is $AGE_TEXT; nothing to do"
    exit 0
  fi
  STALE=0
fi

TIMER_STATE=$(systemctl is-active terror-scan.timer 2>/dev/null || echo unknown)
NEXT_RUN=$(systemctl show terror-scan.timer -p NextElapseUSecRealtime --value 2>/dev/null || echo unknown)

BODY=$(printf '%s\n' \
  "No completed incident scan has been recorded for more than ${THRESHOLD_HOURS} hours." \
  "" \
  "Latest report: $AGE_TEXT" \
  "Timer state: $TIMER_STATE" \
  "Next scheduled run: $NEXT_RUN" \
  "Time: $(date -u '+%Y-%m-%d %H:%M UTC')" \
  "" \
  "Check: systemctl status terror-scan.timer; journalctl -u terror-scan.service -n 50" \
  "" \
  "$SITE")

PAYLOAD=$(jq -n \
  --arg from "$FROM" \
  --arg to "$ALERT_EMAIL_TO" \
  --arg subject "[Terror Tracker] No scan for ${THRESHOLD_HOURS}h" \
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

echo "dead-man alert emailed ($AGE_TEXT, timer $TIMER_STATE)"
