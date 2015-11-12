#!/bin/bash

set -e
set -x

BLD_DIR=`pwd`

SRC_DIR=$RECIPE_DIR/..
pushd $SRC_DIR

version=`$PYTHON scripts/get_bump_version.py`

if [ -e "__travis_build_number__.txt" ]; then
    travis_build_number=$(cat __travis_build_number__.txt)
    if [[ "$travis_build_number" == "release" || "$travis_build_number" == "devel" ]]; then
        # for releases and devel builds we just need the tag
        echo $version > __conda_version__.txt
    else
        # for the testing machinery we also need the travis_build_number
        echo $version.$travis_build_number > __conda_version__.txt
    fi
else
    # for local building we don't have the travis_build_number
    echo $version > __conda_version__.txt
fi

cp __conda_version__.txt $BLD_DIR

pushd bokehjs

if [ -e "__travis_build_number__.txt" ]; then
    if [ ! "$(ls -A $PWD/node_modules)" ]; then
        npm install
    fi
else
    npm install
fi

popd

$PYTHON setup.py --quiet install nightly --build_js --single-version-externally-managed --record=record.txt

mkdir $PREFIX/Examples
cp -r examples $PREFIX/Examples/bokeh

popd

cd $PREFIX
echo $PREFIX

