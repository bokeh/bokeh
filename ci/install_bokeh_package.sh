#!/bin/bash

set -x #echo on

$CONDA/bin/conda install --yes --quiet --offline /tmp/conda-bld/noarch/bokeh-*.bz2

# TODO (bev) remove this when move from bokeh -> src dir struture
rm -rf bokeh
