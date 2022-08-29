#!/bin/bash

set -x #echo on
set -e #exit on error

git status

export VERSION="$(echo "$(ls dist/*.whl)" | cut -d- -f2)"
conda build conda/recipe --no-test --no-anaconda-upload --no-verify
pushd /usr/share/miniconda3/envs/bk-test
tar cvzf conda-bld-noarch.tgz conda-bld/noarch
popd
mv /usr/share/miniconda3/envs/bk-test/conda-bld-noarch.tgz /tmp
