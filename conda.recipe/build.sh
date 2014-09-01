#!/bin/bash

set -e
set -x

BLD_DIR=`pwd`

SRC_DIR=$RECIPE_DIR/..
pushd $SRC_DIR

# X.X.X.dev.YYYYMMDD builds
if [ -e using_tags.txt ]; then
    version=`git describe --tags`
else
    version=`$PYTHON scripts/get_bump_version.py`
fi

date=`date "+%Y%m%d"`
echo $version.dev.$date > __conda_version__.txt
cp __conda_version__.txt $BLD_DIR

pushd bokehjs
npm install
popd

$PYTHON setup.py --quiet install nightly --build_js --single-version-externally-managed --record=record.txt
popd

cd $PREFIX
echo $PREFIX
