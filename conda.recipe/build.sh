#!/bin/bash

BLD_DIR=`pwd`

# Recipe and source are stored together
SRC_DIR=$RECIPE_DIR/..
pushd $SRC_DIR

# X.X.X.dev.YYYYMMDD builds
if [ -e using_tags.txt ]; then
    version=`git describe`
else
    version=`$PYTHON build_scripts/get_bump_version.py`
fi

date=`date "+%Y%m%d"`
echo $version.dev.$date > __conda_version__.txt
cp __conda_version__.txt $BLD_DIR

conda install --yes --force -c bokeh nodejs
conda install --yes --force -c bokeh grunt-cli
ls
pushd bokehjs
ls
npm install
popd

$PYTHON setup.py install nightly --build_js --single-version-externally-managed --record=record.txt
popd

cd $PREFIX
echo $PREFIX

