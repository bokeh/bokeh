#!/bin/bash

set -x #echo on
set -e #exit on error

export VERSION="$(echo $(basename "$(ls dist/*.tar.gz)" .tar.gz) | cut -d- -f2)"

cp "dist/bokeh-$VERSION.tar.gz" /tmp
pushd /tmp
tar xvzf "bokeh-$VERSION.tar.gz"
cd "bokeh-$VERSION"
pip install .
popd

bokeh info
python -m bokeh.util.package $VERSION bokehjs/build
