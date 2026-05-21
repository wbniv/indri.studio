#!/usr/bin/env bash
# Initialise a local aptly repo named 'indri' for the 'stable' suite.
# Idempotent — safe to re-run.
#
# Prereqs: aptly installed (apt install aptly).

set -euo pipefail
cd "$(dirname "$0")/.."

RUNTIME_CONFIG="/tmp/aptly-indri.conf"
PUBLIC_DIR="$(pwd)/public"
jq --arg pub "$PUBLIC_DIR" \
    '.FileSystemPublishEndpoints = {"public": {"rootDir": $pub, "linkMethod": "copy", "verifyMethod": "md5"}}' \
    aptly/aptly.conf > "$RUNTIME_CONFIG"
export APTLY_CONFIG="${APTLY_CONFIG:-$RUNTIME_CONFIG}"

if ! command -v aptly &>/dev/null; then
    echo "ERROR: aptly not installed. Run: sudo apt install aptly" >&2
    exit 1
fi

if ! aptly -config="$APTLY_CONFIG" repo show indri &>/dev/null; then
    echo "Creating aptly repo 'indri'..."
    aptly -config="$APTLY_CONFIG" repo create \
        -distribution=stable \
        -component=main \
        -architectures=amd64,arm64,all \
        indri
else
    echo "Repo 'indri' already exists."
fi

aptly -config="$APTLY_CONFIG" repo show indri
