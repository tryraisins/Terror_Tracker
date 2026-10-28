#!/usr/bin/env bash
# Off-box health probe, run over SSH by the GitHub watchdog workflow.
# Forced-command entry point: it is invoked with no arguments and prints a small
# JSON object on stdout.
#
# It reports the container's liveness and the scan freshness the app itself
# derives from scan_runs, so a dead host, a stopped container and a silent
# collection all fail here rather than in an email nobody gets.
set -uo pipefail

APP=http://127.0.0.1:3001

version=$(curl -sS --max-time 8 "$APP/api/version" 2>/dev/null || true)
if [ -z "$version" ]; then
  echo '{"ok":false,"reason":"app is not answering on the loopback"}'
  exit 0
fi

freshness=$(curl -sS --max-time 8 "$APP/api/scan-health" 2>/dev/null || true)
if [ -z "$freshness" ]; then
  echo '{"ok":false,"reason":"scan-health did not answer"}'
  exit 0
fi

printf '{"ok":true,"version":%s,"scan":%s}\n' "$version" "$freshness"
