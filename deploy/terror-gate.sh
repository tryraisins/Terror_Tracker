#!/usr/bin/env bash
# Forced command for the CI deploy key.
#
#   <40-hex sha>   deploy that image tag
#   health         report container liveness and scan freshness as JSON
#
# Nothing else is accepted: the key cannot run a shell, a file, or a script of
# its own choosing.
set -euo pipefail

cmd="${SSH_ORIGINAL_COMMAND:-}"

case "$cmd" in
  health)
    exec /usr/local/bin/terror-health.sh
    ;;
  *)
    if [[ "$cmd" =~ ^[0-9a-f]{40}$ ]]; then
      exec sudo -n /srv/terror-tracker/deploy.sh "$cmd"
    fi
    echo "refused: expected a 40-character commit sha or 'health'" >&2
    exit 1
    ;;
esac
