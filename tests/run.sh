#!/bin/bash
# Headless fuzz test (2 full games). Needs google-chrome. Slow without a GPU (~3 min).
cd "$(dirname "$0")/.." && python3 build.py && python3 tests/mk_tests.py && \
google-chrome --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --virtual-time-budget=60000 --dump-dom "file://$PWD/tests/t4.html" 2>/dev/null | grep -o 'data-\(ok\|err\)="[^"]*"' | sed 's/&quot;/"/g'
