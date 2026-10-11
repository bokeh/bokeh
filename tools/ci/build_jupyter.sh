#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
frontend="$repo_root/jupyter"

npm --prefix "$frontend" ci --no-progress
npm --prefix "$frontend" run build

test -f "$repo_root/src/bokeh/jupyter/anywidget.js"
test -f "$repo_root/src/bokeh/jupyter/labextension/package.json"
test -f "$repo_root/src/bokeh/jupyter/labextension/install.json"
find "$repo_root/src/bokeh/jupyter/labextension/static" -name 'remoteEntry.*.js' -print -quit | grep -q .
