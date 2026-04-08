#!/bin/sh
set -eu

node --check assets/app.js
node --check assets/data.js
node --check scripts/jd-coverage.mjs
node scripts/validate-data.mjs
