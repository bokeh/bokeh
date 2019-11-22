#!/usr/bin/env bash

source scripts/ci/github/setup_env.sh

echo "exporting a new path ======================="
export PATH="$MINICONDA_PATH:$MINICONDA_SUB_PATH:$PATH"

if [[ $RUNNER_OS ==  "macOS" ]]; then
    echo "============================================"
    echo "Downloading and Installing Miniconda (MacOS)"
    echo "============================================"

    export MINICONDA_DOWNLOAD=$MINICONDA_PATH/download
    echo "MINICONDA_DOWNLOAD = $MINICONDA_DOWNLOAD"

    mkdir -p $MINICONDA_DOWNLOAD;
    echo "downloading miniconda.sh for osx ==========="
    wget -nv https://repo.continuum.io/miniconda/Miniconda3-latest-MacOSX-x86_64.sh -O $MINICONDA_DOWNLOAD/miniconda.sh;

    echo "installing miniconda ======================="
    bash $MINICONDA_DOWNLOAD/miniconda.sh -b -u -p $MINICONDA_PATH;

    echo "============================================"
    echo "Finished Installing Miniconda (MacOS)"
    echo "============================================"
fi

echo "init conda ================================="
$MINICONDA_SUB_PATH/conda init bash

echo "~/$BASHRC =================================="
. ~/$BASHRC

echo "hash -r ===================================="
hash -r

echo "checking python version ===================="
$PYTHON_BIN --version

echo "conda config --yes ========================="
$MINICONDA_SUB_PATH/conda config --set always_yes yes --set changeps1 no;

echo "conda update ==============================="
$MINICONDA_SUB_PATH/conda update -q conda;

echo "conda info -a =============================="
$MINICONDA_SUB_PATH/conda info -a

echo "conda config --set auto_update_conda off ==="
$MINICONDA_SUB_PATH/conda config --set auto_update_conda off

echo "conda config --add channels bokeh =========="
$MINICONDA_SUB_PATH/conda config --add channels bokeh

echo "conda config --add channels conda-forge ===="
$MINICONDA_SUB_PATH/conda config --add channels conda-forge

echo "conda config --get channels ================"
$MINICONDA_SUB_PATH/conda config --get channels

echo "conda install =============================="
$MINICONDA_SUB_PATH/conda install

echo "conda install jinja2 pyyaml ================"
$MINICONDA_SUB_PATH/conda install jinja2 pyyaml

echo "conda install scripts/deps.py build ========"
deps=$(python scripts/deps.py build)
for pkg in "${deps[@]}"; do
    $MINICONDA_SUB_PATH/conda install $pkg
done
