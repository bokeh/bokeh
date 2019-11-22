#!/usr/bin/env bash

source scripts/ci/github/setup_env.sh

echo "activate test environment =================="
source $MINICONDA_SUB_PATH/activate testenv

$MINICONDA_SUB_PATH/conda list

export MINICONDA_PYTEST=$MINICONDA_PATH/envs/testenv/$CONDA_SCRIPT/py.test
dir $MINICONDA_PATH/envs/testenv/$CONDA_SCRIPT/

$MINICONDA_PYTEST -m unit --junit-xml=test_results.xml --diff-ref HEAD
