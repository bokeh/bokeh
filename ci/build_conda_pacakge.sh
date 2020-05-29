#!/bin/bash

set -x #echo o

conda build conda.recipe --quiet --no-test --no-anaconda-upload --no-verify
pushd /usr/share/miniconda3/envs/bk-test
tar cvzf conda-bld-noarch.tgz conda-bld/noarch
popd
mv /usr/share/miniconda3/envs/bk-test/conda-bld-noarch.tgz .
