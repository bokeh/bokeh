#!/bin/bash

set -x #echo on
set -e #exit on error

export VERSION="$(echo "$(ls dist/*.whl)" | cut -d- -f2)"
export WHEEL_PATH="$(pwd)/dist/bokeh-$VERSION-py3-none-any.whl"

pushd dist
python -m pip install --no-deps "bokeh-$VERSION-py3-none-any.whl"
popd
bokeh info
python -m bokeh.util.package $VERSION bokehjs/build

# Exercise a user-style install separately so pip resolves the wheel's runtime
# dependencies without mutating the locked Pixi build environment.
SMOKE_ENV="$(mktemp -d)"
trap 'rm -rf "$SMOKE_ENV"' EXIT
python -m venv "$SMOKE_ENV"
"$SMOKE_ENV/bin/python" -m pip install "$WHEEL_PATH"
"$SMOKE_ENV/bin/bokeh" info
