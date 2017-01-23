#!/bin/bash

$PYTHON setup.py --quiet install --install-js --single-version-externally-managed --record=record.txt

mkdir $PREFIX/Examples
cp -r examples $PREFIX/Examples/bokeh

cd $PREFIX
echo $PREFIX
