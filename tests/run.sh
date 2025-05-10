#!/usr/bin/env bash

set -euo pipefail

cd $(dirname "$0")
cd sls-v3

if [ "$#" -gt 0 ]; then
  ymls=("$@")
else
  ymls=( *.yml )
fi

for yml in "${ymls[@]}"; do
  name="${yml%.yml}"
  echo "Testing $yml ..."
  pnpm sls typespec generate --config "$yml" --output-dir "$name/actual"
  npx --package=@typespec/compiler tsp format "$name/actual/main.tsp"
  if diff -u --color "$name/expected/main.tsp" "$name/actual/main.tsp"; then
    echo "success"
  else
    echo "fail"
  fi
done
