#!/usr/bin/env bash

source scripts/ci/azure/setup_env.sh

echo "activate test_environment =================="
source $MINICONDA_SUB_PATH/activate test_environment

$MINICONDA_SUB_PATH/conda list

export MINICONDA_PYTEST=$MINICONDA_PATH/envs/test_environment/$CONDA_SCRIPT/py.test
dir $MINICONDA_PATH/envs/test_environment/$CONDA_SCRIPT/

$MINICONDA_PYTEST -m unit --junit-xml=test_results.xml --diff-ref HEAD
