#!/bin/bash

set -x #echo on

conda install --yes --quiet -c file:///tmp/conda-bld bokeh

# TODO (bev) remove this when move from bokeh -> src dir struture
python setup.py --install-js
