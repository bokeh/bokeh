#!/bin/bash

set -x #echo on
set -e #exit on error

export VERSION="$(echo "$(ls dist/*.whl)" | cut -d- -f2)"

pushd dist
pip install "bokeh-$VERSION-py3-none-any.whl"
popd
bokeh info
python -m bokeh.util.package $VERSION bokehjs/build
