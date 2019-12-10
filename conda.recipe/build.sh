#!/bin/bash

$PYTHON setup.py --quiet install --install-js --single-version-externally-managed --record=record.txt

cd $PREFIX
echo $PREFIX
