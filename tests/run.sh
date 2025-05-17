#!/usr/bin/env bash

set -euo pipefail

cd $(dirname "$0")
cd sls-v3

EXPERIMENTAL_IR=""
YML_ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--experimental-serverless-ir" ]; then
    EXPERIMENTAL_IR="--experimental-serverless-ir"
  else
    YML_ARGS+=("$arg")
  fi
done

if [ "${#YML_ARGS[@]}" -gt 0 ]; then
  ymls=("${YML_ARGS[@]}")
else
  ymls=( *.yml )
fi

for yml in "${ymls[@]}"; do
  name="${yml%.yml}"
  echo "Testing $yml ..."
  pnpm sls typespec generate --config "$yml" --output-dir "$name/actual" $EXPERIMENTAL_IR
  npx --package=@typespec/compiler tsp format "$name/actual/main.tsp"
  if diff -u --color "$name/expected/main.tsp" "$name/actual/main.tsp"; then
    echo "success"
  else
    echo "fail"
  fi
done
