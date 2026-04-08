#!/bin/sh
set -eu

git config core.hooksPath .githooks
echo "Configured local Git hooks path to .githooks"
echo "pre-commit -> ./scripts/check-fast.sh"
echo "pre-push   -> ./scripts/check-full.sh"
echo "Reminder: hooks reduce manual checks, but GitHub Pages still publishes only after a remote push."
