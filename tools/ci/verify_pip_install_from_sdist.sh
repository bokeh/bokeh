#!/bin/bash

set -x #echo on
set -e #exit on error

export VERSION="$(echo $(basename "$(ls dist/*.tar.gz)" .tar.gz) | cut -d- -f2)"

cp "dist/bokeh-$VERSION.tar.gz" /tmp
pushd /tmp
tar xvzf "bokeh-$VERSION.tar.gz"
cd "bokeh-$VERSION"
test -f src/bokeh/jupyter/anywidget.js
test -f src/bokeh/jupyter/labextension/package.json
find src/bokeh/jupyter/labextension/static -name 'remoteEntry.*.js' -print -quit | grep -q .
test ! -e jupyter
python -m pip install --no-deps .
popd

bokeh info
python -m bokeh.util.package $VERSION bokehjs/build
