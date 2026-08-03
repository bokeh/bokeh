#!/bin/bash

set -x #echo on
set -e #exit on error

export VERSION="$(echo "$(ls dist/*.whl)" | cut -d- -f2)"

conda install --no-deps "$CONDA_PREFIX/conda-bld/noarch/bokeh-$VERSION-py_0.tar.bz2"
conda list bokeh
bokeh info
python -m bokeh.util.package $VERSION bokehjs/build
