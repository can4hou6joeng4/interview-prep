#!/bin/sh
set -eu

node --check assets/app.js
node --check assets/data.js
node scripts/validate-data.mjs
