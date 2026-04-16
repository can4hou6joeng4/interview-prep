#!/bin/sh
set -eu

node --check assets/app.js
node --check assets/data.js
[ -f scripts/jd-coverage.mjs ] && node --check scripts/jd-coverage.mjs
node --check scripts/slug.mjs
node --check scripts/build-pages.mjs
node --check scripts/validate-pages.mjs
node scripts/validate-data.mjs
node scripts/_slug.test.mjs
node scripts/validate-pages.mjs
