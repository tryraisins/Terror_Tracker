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
# GHCR resets large layer downloads from this host over IPv6 (confirmed with a
# direct comparison: the same file over IPv4 takes two seconds, over IPv6 it
# fails immediately), so the pull retries with a widening backoff. Layer progress
# already made is kept between attempts, so the loop converges.
pull_images() {
  local attempt delay
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if docker compose --env-file .env.deploy pull app scan >/tmp/terror-tracker-pull.log 2>&1; then
      return 0
    fi
    delay=$(( attempt * 5 ))
    echo "pull attempt $attempt failed: $(tail -n 1 /tmp/terror-tracker-pull.log)" >&2
    sleep "$delay"
  done
  return 1
}

if ! pull_images; then
  if docker image inspect "ghcr.io/tryraisins/terror-tracker:$TAG" >/dev/null 2>&1; then
    echo "pull failed but $TAG is already present locally; continuing" >&2
  else
    echo "pull failed and $TAG is not present locally" >&2
    exit 1
  fi
fi

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
