#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
frontend="$repo_root/src/bokeh/jupyter/frontend"

npm --prefix "$frontend" ci --no-progress
npm --prefix "$frontend" run build

test -f "$repo_root/src/bokeh/jupyter/anywidget.js"
test -f "$repo_root/src/bokeh/jupyter/labextension/package.json"
test -f "$repo_root/src/bokeh/jupyter/labextension/install.json"
find "$repo_root/src/bokeh/jupyter/labextension/static" -name 'remoteEntry.*.js' -print -quit | grep -q .

if [[ "${1:-}" == "--verify" ]]; then
  git -C "$repo_root" diff --exit-code -- src/bokeh/jupyter/anywidget.js src/bokeh/jupyter/labextension
  test -z "$(git -C "$repo_root" ls-files --others --exclude-standard -- src/bokeh/jupyter/anywidget.js src/bokeh/jupyter/labextension)"
fi
