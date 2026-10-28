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

# CI is serialised by its workflow concurrency group; a manual run is not, and two
# deploys racing would corrupt .current-tag and .env.deploy.
exec 9>/run/terror-deploy.lock
if ! flock -w 600 9; then
  echo "another deploy is holding /run/terror-deploy.lock" >&2
  exit 1
fi

STATE="$BASE/.current-tag"
PREVIOUS=""
if [ -f "$STATE" ]; then
  PREVIOUS=$(cat "$STATE")
fi

echo "deploying $TAG (previous: ${PREVIOUS:-none})"

# The tag is passed through the environment for every compose call. .env.deploy is
# only written once the images are confirmed, so a failed pull can never point
# run-scan.sh at an image that was never fetched.
export IMAGE_TAG="$TAG"

# GHCR resets large layer downloads from this host over IPv6 (measured: the same
# file is fine over IPv4 and fails instantly over IPv6), so the pull retries with
# a widening backoff. Layer progress already made is kept between attempts.
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
  if docker image inspect "ghcr.io/tryraisins/terror-tracker:$TAG" >/dev/null 2>&1 \
    && docker image inspect "ghcr.io/tryraisins/terror-tracker:$TAG-scan" >/dev/null 2>&1; then
    echo "pull failed but both $TAG images are present locally; continuing" >&2
  else
    echo "pull failed and the $TAG images are not both present locally" >&2
    exit 1
  fi
fi

printf 'IMAGE_TAG=%s\n' "$TAG" > .env.deploy

docker compose --env-file .env.deploy up -d --no-deps --force-recreate app

# Readiness, not just liveness: this endpoint queries Mongo, so a bad MONGODB_URI
# or a blocked Atlas allowlist fails here instead of in front of readers.
probe() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
    "http://127.0.0.1:3001/api/attacks?limit=1" 2>/dev/null || true)
  [ "$code" = "200" ]
}

wait_for_probe() {
  local _
  for _ in $(seq 1 24); do
    sleep 5
    probe && return 0
  done
  return 1
}

# Keep the current and previous tags so a rollback target always exists, and drop
# older sha-tagged images. `docker image prune -f` alone only removes dangling
# layers, so two images per deploy would accumulate on a shared box.
prune_images() {
  local ref tag keep
  for ref in $(docker images --format '{{.Repository}}:{{.Tag}}' ghcr.io/tryraisins/terror-tracker); do
    tag=${ref##*:}
    case "$tag" in
      latest | latest-scan | "<none>") continue ;;
    esac
    keep=0
    [ "$tag" = "$TAG" ] && keep=1
    [ "$tag" = "$TAG-scan" ] && keep=1
    if [ -n "$PREVIOUS" ]; then
      [ "$tag" = "$PREVIOUS" ] && keep=1
      [ "$tag" = "$PREVIOUS-scan" ] && keep=1
    fi
    [ "$keep" = "0" ] && docker rmi "$ref" >/dev/null 2>&1 || true
  done
}

if wait_for_probe; then
  printf '%s\n' "$TAG" > "$STATE"
  echo "healthy on $TAG"
  prune_images
  exit 0
fi

echo "readiness probe failed for $TAG" >&2

if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" != "$TAG" ]; then
  echo "rolling back to $PREVIOUS" >&2
  printf 'IMAGE_TAG=%s\n' "$PREVIOUS" > .env.deploy
  if docker compose --env-file .env.deploy up -d --no-deps --force-recreate app && wait_for_probe; then
    echo "rollback healthy on $PREVIOUS" >&2
  else
    echo "ROLLBACK FAILED: $PREVIOUS did not pass the probe either, the site may be down" >&2
  fi
else
  echo "nothing to roll back to" >&2
fi

exit 1
