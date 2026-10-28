#!/usr/bin/env bash
# Deploy one image tag onto the host, with a readiness probe and automatic rollback.
# Called by CI over SSH and usable by hand:
#   /srv/terror-tracker/deploy.sh <github-sha>
set -euo pipefail

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "usage: deploy.sh <image-tag>" >&2
  exit 2
fi

BASE=/srv/terror-tracker
cd "$BASE"

STATE="$BASE/.current-tag"
PREVIOUS=""
if [ -f "$STATE" ]; then
  PREVIOUS=$(cat "$STATE")
fi

echo "deploying $TAG (previous: ${PREVIOUS:-none})"

printf 'IMAGE_TAG=%s\n' "$TAG" > .env.deploy

# Pull both targets so the scan timer never runs against a stale image.
docker compose --env-file .env.deploy pull app scan

docker compose --env-file .env.deploy up -d --no-deps --force-recreate app

# Readiness, not just liveness: this endpoint queries Mongo, so a bad
# MONGODB_URI or a blocked Atlas allowlist fails here instead of in front of users.
probe() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
    "http://127.0.0.1:3001/api/attacks?limit=1" 2>/dev/null || true)
  [ "$code" = "200" ]
}

for _ in $(seq 1 24); do
  sleep 5
  if probe; then
    printf '%s\n' "$TAG" > "$STATE"
    echo "healthy on $TAG"
    docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
    exit 0
  fi
done

echo "readiness probe failed for $TAG" >&2

if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" != "$TAG" ]; then
  echo "rolling back to $PREVIOUS" >&2
  printf 'IMAGE_TAG=%s\n' "$PREVIOUS" > .env.deploy
  docker compose --env-file .env.deploy up -d --no-deps --force-recreate app || true
fi

exit 1
