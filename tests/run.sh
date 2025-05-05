#!/usr/bin/env bash

set -euo pipefail

cd $(dirname "$0")
cd sls-v3

for yml in *.yml; do
  name="${yml%.yml}"
  echo "Testing $yml ..."
  pnpm sls typespec generate --config "$yml" --output-dir "$name/actual"
  if diff -u "$name/actual/main.tsp" "$name/expected/main.tsp"; then
    echo "success"
  else
    echo "fail"
  fi
done
