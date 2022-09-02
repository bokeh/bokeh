#!/bin/bash

set -x #echo on
set -e #exit on error

export VERSION="$(echo "$(ls dist/*.whl)" | cut -d- -f2)"

# release automation saves in a different location
export LOC=${1:-"$CONDA_PREFIX/conda-bld/noarch"}

conda install --no-deps "$LOC/bokeh-$VERSION-py_0.tar.bz2"
conda list bokeh
bokeh info
python -m bokeh.util.package $VERSION bokehjs/build
