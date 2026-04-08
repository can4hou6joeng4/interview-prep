#!/bin/sh
set -eu

./scripts/check-fast.sh
node scripts/validate-site.mjs
