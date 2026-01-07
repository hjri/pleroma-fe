#!/bin/sh

set -u

COMPOSE_FILE="docker-compose.e2e.yml"

: "${PLEROMA_IMAGE:=git.pleroma.social:5050/pleroma/pleroma:stable}"
: "${E2E_ADMIN_USERNAME:=admin}"
: "${E2E_ADMIN_PASSWORD:=adminadmin}"
: "${E2E_ADMIN_EMAIL:=admin@example.com}"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

cleanup

trap 'cleanup; exit 130' INT TERM

set +e
docker compose -f "$COMPOSE_FILE" up --build --remove-orphans --abort-on-container-exit --exit-code-from e2e
result="$?"
set -e

if [ "$result" -ne 0 ]; then
  docker compose -f "$COMPOSE_FILE" cp e2e:/app/test/e2e-playwright/test-results test/e2e-playwright/test-results >/dev/null 2>&1 || true
  docker compose -f "$COMPOSE_FILE" cp e2e:/app/test/e2e-playwright/playwright-report test/e2e-playwright/playwright-report >/dev/null 2>&1 || true
fi

cleanup

exit "$result"
