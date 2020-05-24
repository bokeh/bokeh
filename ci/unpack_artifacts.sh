#!/bin/bash

set -x #echo on

tar xvzf conda-bld-noarch/conda-bld-noarch.tgz -C /usr/share/miniconda3/envs/bk-test
tar xvzf bokehjs-build/bokehjs-build.tgz
