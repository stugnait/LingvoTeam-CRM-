#!/bin/sh
set -eu

export POSTGRES_DB="${POSTGRES_DB:-${DB_NAME:?DB_NAME is required}}"
export POSTGRES_USER="${POSTGRES_USER:-${DB_USER:?DB_USER is required}}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-${DB_PASSWORD:?DB_PASSWORD is required}}"

exec docker-entrypoint.sh "$@"
