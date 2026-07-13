#!/bin/sh

set -u

COMPOSE_FILE="docker-compose.e2e.yml"

: "${COMPOSE_MENU:=false}"
: "${PLEROMA_IMAGE:=git.pleroma.social/pleroma/pleroma:stable}"
: "${E2E_ADMIN_USERNAME:=admin}"
: "${E2E_ADMIN_PASSWORD:=adminadmin}"
: "${E2E_ADMIN_EMAIL:=admin@example.com}"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

cleanup

trap 'cleanup; exit 130' INT TERM

set +e
COMPOSE_MENU="$COMPOSE_MENU" docker compose -f "$COMPOSE_FILE" up --build --remove-orphans --attach e2e --no-log-prefix --abort-on-container-exit --exit-code-from e2e
result="$?"
set -e

if [ "$result" -ne 0 ]; then
  docker compose -f "$COMPOSE_FILE" cp e2e:/app/test/e2e-playwright/test-results test/e2e-playwright >/dev/null 2>&1 || true
  docker compose -f "$COMPOSE_FILE" cp e2e:/app/test/e2e-playwright/playwright-report test/e2e-playwright >/dev/null 2>&1 || true
  mkdir -p test/e2e-playwright/test-results
  docker compose -f "$COMPOSE_FILE" logs --no-color pleroma db > test/e2e-playwright/test-results/docker-compose.log 2>/dev/null || true
fi

cleanup

exit "$result"
