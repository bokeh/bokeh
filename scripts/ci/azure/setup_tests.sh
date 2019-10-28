#!/usr/bin/env bash

source scripts/ci/azure/setup_env.sh

bokeh sampledata

echo "create test_environment ===================="
$MINICONDA_SUB_PATH/conda create --name test_environment

echo "activate test_environment =================="
source $MINICONDA_SUB_PATH/activate test_environment

echo "conda install jinja2 pyyaml ================"
$MINICONDA_SUB_PATH/conda install phantomjs jinja2 pyyaml

echo "conda install scripts/deps.py run test ====="
deps=$(python scripts/deps.py run test)
for pkg in "${deps[@]}"; do
    $MINICONDA_SUB_PATH/conda install $pkg
done
