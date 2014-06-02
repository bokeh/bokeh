#!/bin/bash

conda build conda.recipe --quiet;

CONDA_ENV=`conda info --json | jsawk 'return this.root_prefix'`
PLATFORM=`conda info --json | jsawk 'return this.platform'`
BUILD_PATH=$CONDA_ENV/conda-bld/$PLATFORM

#echo build path: $BUILD_PATH
date=`date "+%Y%m%d"`

conda convert -p win-64 -f $BUILD_PATH/bokeh*$date*.tar.bz2;
conda convert -p osx-64 -f $BUILD_PATH/bokeh*$date*.tar.bz2;
conda convert -p linux-64 -f $BUILD_PATH/bokeh*$date*.tar.bz2;

binstar upload -u bokeh osx-64/bokeh*$date*.tar.bz2 -c dev;
binstar upload -u bokeh win-64/bokeh*$date*.tar.bz2 -c dev;
binstar upload -u bokeh linux-64/bokeh*$date*.tar.bz2 -c dev;

rm -rf osx-64 linux-64 win-64

echo "I'm done uploading"
