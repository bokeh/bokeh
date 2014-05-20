#!/bin/bash

$PYTHON setup.py install --build_js --single-version-externally-managed --record=record.txt
cd $PREFIX
echo $PREFIX
find . -name '*.pyc' -delete