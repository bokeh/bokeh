#!/bin/bash

set -x #echo on
set -e #exit on error

export VERSION="$(echo $(basename "$(ls dist/*.tar.gz)" .tar.gz) | cut -d- -f2)"

cp "dist/bokeh-$VERSION.tar.gz" /tmp
pushd /tmp
pip install "bokeh-$VERSION.tar.gz"
popd

bokeh info
python -m bokeh.util.package $VERSION bokehjs/build
