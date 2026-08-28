#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="svc0176p-isas-fsd"
SECRET_NAME="ar-game-2-secrets"
ENV_FILE="$(dirname "$0")/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

oc create secret generic "$SECRET_NAME" \
  --namespace "$NAMESPACE" \
  --from-env-file="$ENV_FILE" \
  --dry-run=client -o yaml | oc apply -f -

oc apply -f "$(dirname "$0")/deploy.yaml"
