#!/bin/bash

set -x #echo on
set -e #exit on error

pushd dist
tar xvzf bokeh-*.tar.gz
cd `ls -d */ | cut -f1 -d'/'`
pip install .
bokeh info
popd
