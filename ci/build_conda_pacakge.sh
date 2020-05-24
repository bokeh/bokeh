#!/bin/bash

set -x #echo o

conda build conda.recipe --quiet --no-test --no-anaconda-upload --no-verify
pushd $HOME
tar czf conda-bld-noarch.tgz "/usr/share/miniconda3/envs/bk-build/conda-bld/noarch"
popd
mv $HOME/conda-bld-noarch.tgz .
