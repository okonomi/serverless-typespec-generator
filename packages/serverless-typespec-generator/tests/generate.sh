#!/usr/bin/env bash

set -euo pipefail

cd $(pnpm --workspace-root exec pwd)/examples/with-sls-v3
pnpm gen:api:typespec

diff -u dist/typespec/main.tsp $(pnpm --workspace-root exec pwd)/packages/serverless-typespec-generator/tests/expected.tsp
if [ $? -eq 0 ]; then
  echo "success"
else
  echo "fail"
fi
