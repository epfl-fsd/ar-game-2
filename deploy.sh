#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="svc0176p-isas-fsd"
SECRET_NAME="ar-game-2-secrets"
SCRIPT_DIR="$(dirname "$0")"
ENV_FILE="$SCRIPT_DIR/.env"
VERSION="$(node -p "require('$SCRIPT_DIR/package.json').version")"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

oc create secret generic "$SECRET_NAME" \
  --namespace "$NAMESPACE" \
  --from-env-file="$ENV_FILE" \
  --dry-run=client -o yaml | oc apply -f -

sed "s/:VERSION\$/:$VERSION/" "$SCRIPT_DIR/deploy.yaml" | oc apply -f - --server-side --namespace "$NAMESPACE"
