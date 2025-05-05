#!/usr/bin/env bash

set -euo pipefail

cd $(dirname "$0")

cd sls-v3

pnpm sls typespec generate --config basic.yml --output-dir basic/actual

diff -u basic/actual/main.tsp basic/expected/main.tsp
if [ $? -eq 0 ]; then
  echo "success"
else
  echo "fail"
fi
