#!/bin/bash

set -eu

CONDA_DIR=/home/docker/conda_bokeh
DEFAULT_PY=3.9
ENV_NAME=bkdev
MINICONDA_SCRIPT=Miniconda3-latest-Linux-x86_64.sh

eval "$(fixuid -q)"

if [ "${BOKEH_DOCKER_CHROME_VERSION:-0}" == 1 ]; then
    # Print numerical chrome version and exit.
    google-chrome --version | awk '{print $NF}'
    exit 1
fi

if [ ! -d .git ] || [ ! -f environment.yml ]; then
    echo "Directory does not contain Bokeh git repo."
    exit 2
fi

if [ "${BOKEH_DOCKER_CONDA:-1}" == 1 ]; then
    # Check environment file exists.
    BOKEH_DOCKER_PY=${BOKEH_DOCKER_PY:-$DEFAULT_PY}
    ENV_YML_FILE=ci/environment-test-$BOKEH_DOCKER_PY.yml
    if [ ! -f $ENV_YML_FILE ]; then
        echo "Cannot find environment file $ENV_YML_FILE"
        exit 3
    fi

    if [ ! -f "$CONDA_DIR/condabin/conda" ]; then
        # Install miniconda into $CONDA_DIR on docker filesystem.
        START_DIR=$(pwd)
        cd /tmp
        curl -LO "http://repo.continuum.io/miniconda/$MINICONDA_SCRIPT"
        bash $MINICONDA_SCRIPT -p $CONDA_DIR -b
        rm $MINICONDA_SCRIPT
        cd $START_DIR
    fi

    # Activate conda in .bashrc and in this shell.
    $CONDA_DIR/condabin/conda init bash > /dev/null
    . $CONDA_DIR/etc/profile.d/conda.sh

    if [ ! -d "$CONDA_DIR/envs/$ENV_NAME" ]; then
        # Create conda environment and install required packagaes.
        conda env create -n $ENV_NAME -f $ENV_YML_FILE
    fi

    # Ensure conda environment is activated in this shell and in new shells.
    conda activate $ENV_NAME
    echo "conda activate $ENV_NAME" >> ~/.bashrc
fi

google-chrome --version

if [ "${BOKEH_DOCKER_BUILD:-0}" == 1 ]; then
    bash ci/docker/bokeh_docker_build.sh
fi

if [ "${BOKEH_DOCKER_TEST:-0}" == 1 ]; then
    bash ci/docker/bokeh_docker_test.sh
fi

/bin/bash "$@"
