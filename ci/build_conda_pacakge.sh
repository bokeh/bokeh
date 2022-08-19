#!/bin/bash

set -x #echo on
set -e #exit on error

git status

export VERSION="$(echo "$(ls dist/*.whl)" | cut -d- -f2)"
conda build conda.recipe --no-test --no-anaconda-upload --no-verify --output-folder /tmp/bld
tar cvzf /tmp/conda-bld-noarch.tgz conda-bld/noarch --directory=/usr/share/miniconda3/envs/bk-test
