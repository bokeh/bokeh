#!/usr/bin/env bash

source scripts/ci/github/setup_env.sh

python -c 'import bokeh; bokeh.sampledata.download(progress=False)'

echo "create test environment ===================="
$MINICONDA_SUB_PATH/conda create --name testenv

echo "activate test environment =================="
source $MINICONDA_SUB_PATH/activate testenv

echo "conda install jinja2 pyyaml ================"
$MINICONDA_SUB_PATH/conda install phantomjs jinja2 pyyaml

echo "conda install scripts/deps.py run test ====="
deps=$(python scripts/deps.py run test)
for pkg in "${deps[@]}"; do
    $MINICONDA_SUB_PATH/conda install $pkg
done
