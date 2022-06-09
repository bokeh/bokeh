#!/bin/bash

BOKEHJS_ACTION=install $PYTHON -m pip install .

cd $PREFIX
echo $PREFIX
