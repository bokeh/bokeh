#!/bin/sh

# Runs all necessary services for Bokeh in development mode

redis-server &
pushd bokeh/server/
hem server -d &
popd
python runserver.py -d -j

