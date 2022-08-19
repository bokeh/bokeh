#!/bin/bash

set -x #echo on
set -e #exit on error

mkdir /tmp/sdist
tar xvzf dist/bokeh-*.tar.gz -C /tmp/sdist --strip-components=1
cd /tmp/sdist
pip install .
bokeh info
