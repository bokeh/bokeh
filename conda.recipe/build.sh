#!/bin/bash

# Recipe and source are stored together
SRC_DIR=$RECIPE_DIR/..
pushd $SRC_DIR
ls
conda install --yes --force -c wakari nodejs
conda install --yes --force -c wakari grunt-cli
ls
pushd bokehjs
ls
npm install
popd

$PYTHON setup.py install --build_js --single-version-externally-managed --record=record.txt
popd

cd $PREFIX
echo $PREFIX
find . -name '*.pyc' -delete